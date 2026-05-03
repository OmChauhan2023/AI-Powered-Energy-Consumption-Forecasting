"""Training Agent: Handles model training, hyperparameter tuning, and ensemble creation."""
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
from scipy.optimize import minimize


class TrainingAgent:
    """Manages training pipeline: model training, tuning, ensemble creation."""

    # Best hyperparameters from 200-trial XGBoost Optuna run
    BEST_XGB_PARAMS = {
        'max_depth': 10, 'min_child_weight': 4,
        'gamma': 1.6542197232370162, 'n_estimators': 3200,
        'learning_rate': 0.0063577141135061615,
        'subsample': 0.9645447868279199,
        'colsample_bytree': 0.9988535805516009,
        'colsample_bylevel': 0.9982705779061344,
        'colsample_bynode': 0.9071966512358965,
        'reg_alpha': 1.5602208685598858e-06,
        'reg_lambda': 6.029136821807975e-07,
        'tree_method': 'hist', 'random_state': 42,
        'verbosity': 0, 'early_stopping_rounds': 50,
    }

    def __init__(self, model_dir: str = "models", output_dir: str = "outputs"):
        self.model_dir = Path(model_dir)
        self.output_dir = Path(output_dir)
        self.model_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
        self.logger = self._setup_logger()
        self.scaler = StandardScaler()

    def _setup_logger(self):
        import logging
        logger = logging.getLogger("TrainingAgent")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter("[TrainingAgent] %(message)s")
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    def _calculate_mape(self, y_true, y_pred):
        """Calculate Mean Absolute Percentage Error."""
        y_true = np.array(y_true)
        y_pred = np.array(y_pred)
        mask = y_true != 0
        return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

    def _display_metrics(self, y_true, y_pred, model_name):
        """Display MAE, RMSE, and MAPE for a model."""
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        mape = self._calculate_mape(y_true, y_pred)

        print(f"\n{'='*50}")
        print(f"  {model_name} - Performance Metrics")
        print(f"{'='*50}")
        print(f"  MAE  (Mean Absolute Error):    {mae:,.4f}")
        print(f"  RMSE (Root Mean Squared Error): {rmse:,.4f}")
        print(f"  MAPE (Mean Absolute % Error):  {mape:.4f}%")
        print(f"{'='*50}")

        return {'MAE': mae, 'RMSE': rmse, 'MAPE': mape}

    def train_xgboost(self, X_train, y_train, X_val, y_val, features):
        """Train XGBoost with best params."""
        self.logger.info("Training XGBoost...")

        dtrain = xgb.DMatrix(X_train[features], label=y_train)
        dval = xgb.DMatrix(X_val[features], label=y_val)

        params = self.BEST_XGB_PARAMS.copy()
        params['objective'] = 'reg:absoluteerror'

        evals = [(dtrain, 'train'), (dval, 'val')]
        evals_result = {}

        model = xgb.train(
            params, dtrain, num_boost_round=params.pop('n_estimators'),
            evals=evals, evals_result=evals_result,
            early_stopping_rounds=params.pop('early_stopping_rounds', 50),
            verbose_eval=50
        )

        self.logger.info(f"XGBoost best round: {model.best_iteration}")
        return model

    def train_lightgbm(self, X_train, y_train, X_val, y_val, features,
                       n_estimators=2500, learning_rate=0.08, num_leaves=100,
                       reg_alpha=0.001, reg_lambda=0.5):
        """Train LightGBM with custom params."""
        self.logger.info("Training LightGBM...")

        train_data = lgb.Dataset(X_train[features], label=y_train)
        val_data = lgb.Dataset(X_val[features], label=y_val, reference=train_data)

        params = {
            'objective': 'mae',
            'num_leaves': num_leaves,
            'learning_rate': learning_rate,
            'reg_alpha': reg_alpha,
            'reg_lambda': reg_lambda,
            'random_state': 42,
            'verbose': -1,
        }

        model = lgb.train(
            params, train_data, num_boost_round=n_estimators,
            valid_sets=[train_data, val_data],
            valid_names=['train', 'val'],
            callbacks=[lgb.early_stopping(50), lgb.log_evaluation(50)]
        )

        self.logger.info(f"LightGBM trained with {model.num_trees()} trees")
        return model

    def train_catboost(self, X_train, y_train, X_val, y_val, features,
                       iterations=2000, learning_rate=0.09, depth=8):
        """Train CatBoost with custom params."""
        self.logger.info("Training CatBoost...")

        model = CatBoostRegressor(
            iterations=iterations,
            learning_rate=learning_rate,
            depth=depth,
            loss_function='MAE',
            random_state=42,
            verbose=50,
            early_stopping_rounds=50
        )

        model.fit(
            X_train[features], y_train,
            eval_set=[(X_val[features], y_val)],
            use_best_model=True
        )

        self.logger.info(f"CatBoost trained with {model.tree_count_} trees")
        return model

    def predict_ensemble(self, models_dict, X, features):
        """Generate predictions from all models."""
        preds = {}

        xgb_model, lgb_model, cat_model = models_dict['xgb'], models_dict['lgb'], models_dict['cat']

        # XGBoost
        dX = xgb.DMatrix(X[features])
        preds['xgb'] = xgb_model.predict(dX)

        # LightGBM
        preds['lgb'] = lgb_model.predict(X[features], num_iteration=lgb_model.num_trees())

        # CatBoost
        preds['cat'] = cat_model.predict(X[features])

        return preds

    def optimize_ensemble_weights(self, preds_dict, y_val, method='nelder-mead'):
        """Optimize ensemble weights using Nelder-Mead."""
        self.logger.info(f"Optimizing ensemble weights with {method}...")

        def neg_mae(weights):
            w = np.array(weights)
            w = w / w.sum()  # Normalize to sum to 1
            ensemble = sum(w[i] * preds_dict[k] for i, k in enumerate(['xgb', 'lgb', 'cat']))
            mae = np.mean(np.abs(ensemble - y_val))
            return mae

        x0 = np.array([0.3, 0.3, 0.4])  # Initial guess
        result = minimize(neg_mae, x0, method='Nelder-Mead',
                         options={'maxiter': 5000, 'xatol': 1e-6, 'fatol': 1e-6})

        optimal_w = result.x / result.x.sum()
        self.logger.info(f"Optimal weights: XGB={optimal_w[0]:.4f}, LGB={optimal_w[1]:.4f}, CAT={optimal_w[2]:.4f}")
        self.logger.info(f"Val MAE: {result.fun:.4f}")

        return optimal_w

    def save_models(self, models_dict, weights, suffix=''):
        """Save trained models and weights."""
        xgb_path = self.model_dir / f"trained_xgb{suffix}.pkl"
        lgb_path = self.model_dir / f"trained_lgb{suffix}.pkl"
        cat_path = self.model_dir / f"trained_cat{suffix}.pkl"
        weights_path = self.model_dir / f"ensemble_weights{suffix}.npy"

        pickle.dump(models_dict['xgb'], open(xgb_path, 'wb'))
        pickle.dump(models_dict['lgb'], open(lgb_path, 'wb'))
        pickle.dump(models_dict['cat'], open(cat_path, 'wb'))
        np.save(weights_path, weights)

        self.logger.info(f"Models saved to {self.model_dir}")
        return xgb_path, lgb_path, cat_path, weights_path

    def load_models(self, suffix=''):
        """Load trained models and weights."""
        xgb_path = self.model_dir / f"trained_xgb{suffix}.pkl"
        lgb_path = self.model_dir / f"trained_lgb{suffix}.pkl"
        cat_path = self.model_dir / f"trained_cat{suffix}.pkl"
        weights_path = self.model_dir / f"ensemble_weights{suffix}.npy"

        models_dict = {
            'xgb': pickle.load(open(xgb_path, 'rb')),
            'lgb': pickle.load(open(lgb_path, 'rb')),
            'cat': pickle.load(open(cat_path, 'rb')),
        }
        weights = np.load(weights_path)

        self.logger.info(f"Models loaded from {self.model_dir}")
        return models_dict, weights
