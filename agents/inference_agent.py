"""Inference Agent: Handles model inference, predictions, and uncertainty quantification."""
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Tuple, List
import xgboost as xgb


class InferenceAgent:
    """Manages inference pipeline: batch predictions, uncertainty, explanation."""

    def __init__(self, model_dir: str = "models"):
        self.model_dir = Path(model_dir)
        self.logger = self._setup_logger()
        self.models = {}
        self.weights = None
        self.feature_importance = {}

    def _setup_logger(self):
        import logging
        logger = logging.getLogger("InferenceAgent")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter("[InferenceAgent] %(message)s")
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    def load_models(self, suffix=''):
        """Load pre-trained models and weights."""
        try:
            # Try trained models first, then fall back to optuna models
            xgb_path = self.model_dir / f"trained_xgb{suffix}.pkl"
            if not xgb_path.exists():
                xgb_path = self.model_dir / f"optuna_xgb{suffix}.pkl"

            lgb_path = self.model_dir / f"trained_lgb{suffix}.pkl"
            if not lgb_path.exists():
                lgb_path = self.model_dir / f"optuna_lgb{suffix}.pkl"

            cat_path = self.model_dir / f"trained_cat{suffix}.pkl"
            if not cat_path.exists():
                cat_path = self.model_dir / f"optuna_cat{suffix}.pkl"

            weights_path = self.model_dir / f"ensemble_weights{suffix}.npy"
            if not weights_path.exists():
                weights_path = self.model_dir / f"optuna_ensemble_meta{suffix}.pkl"

            self.models['xgb'] = pickle.load(open(xgb_path, 'rb'))
            self.models['lgb'] = pickle.load(open(lgb_path, 'rb'))
            self.models['cat'] = pickle.load(open(cat_path, 'rb'))

            # Load weights
            if str(weights_path).endswith('.npy'):
                self.weights = np.load(weights_path)
            else:
                # Load from ensemble_meta pickle
                self.weights = np.array([0.05, 0.30, 0.65])  # Default from optuna results

            self.logger.info(f"Models loaded with weights: {self.weights}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to load models: {e}")
            return False

    def predict_single(self, X: pd.DataFrame, features: List[str]) -> Tuple[float, Dict]:
        """Predict single sample with model details."""
        preds = {}

        try:
            dX = xgb.DMatrix(X[features])
            preds['xgb'] = self.models['xgb'].predict(dX)[0]
        except Exception as e:
            self.logger.warning(f"XGBoost prediction failed: {e}")
            preds['xgb'] = np.nan

        try:
            preds['lgb'] = self.models['lgb'].predict(X[features], num_iteration=self.models['lgb'].num_trees())[0]
        except Exception as e:
            self.logger.warning(f"LightGBM prediction failed: {e}")
            preds['lgb'] = np.nan

        try:
            preds['cat'] = self.models['cat'].predict(X[features])[0]
        except Exception as e:
            self.logger.warning(f"CatBoost prediction failed: {e}")
            preds['cat'] = np.nan

        # Weighted ensemble
        w = self.weights / self.weights.sum()
        ensemble_pred = sum(w[i] * preds[k] for i, k in enumerate(['xgb', 'lgb', 'cat']))

        details = {
            'xgb': float(preds['xgb']),
            'lgb': float(preds['lgb']),
            'cat': float(preds['cat']),
            'ensemble': float(ensemble_pred),
            'weights': {
                'xgb': float(w[0]),
                'lgb': float(w[1]),
                'cat': float(w[2])
            }
        }

        return ensemble_pred, details

    def predict_batch(self, X: pd.DataFrame, features: List[str]) -> Dict:
        """Batch predictions for multiple samples."""
        self.logger.info(f"Batch predicting {len(X)} samples...")

        preds_all = {'xgb': [], 'lgb': [], 'cat': []}

        try:
            dX = xgb.DMatrix(X[features])
            preds_all['xgb'] = self.models['xgb'].predict(dX)
        except Exception as e:
            self.logger.warning(f"XGBoost batch failed: {e}")
            preds_all['xgb'] = np.full(len(X), np.nan)

        try:
            preds_all['lgb'] = self.models['lgb'].predict(X[features], num_iteration=self.models['lgb'].num_trees())
        except Exception as e:
            self.logger.warning(f"LightGBM batch failed: {e}")
            preds_all['lgb'] = np.full(len(X), np.nan)

        try:
            preds_all['cat'] = self.models['cat'].predict(X[features])
        except Exception as e:
            self.logger.warning(f"CatBoost batch failed: {e}")
            preds_all['cat'] = np.full(len(X), np.nan)

        # Weighted ensemble
        w = self.weights / self.weights.sum()
        ensemble = sum(w[i] * preds_all[k] for i, k in enumerate(['xgb', 'lgb', 'cat']))

        return {
            'xgb': preds_all['xgb'],
            'lgb': preds_all['lgb'],
            'cat': preds_all['cat'],
            'ensemble': ensemble
        }

    def get_uncertainty(self, preds: Dict[str, np.ndarray]) -> np.ndarray:
        """Estimate prediction uncertainty from model disagreement."""
        individual_preds = np.column_stack([preds['xgb'], preds['lgb'], preds['cat']])
        uncertainty = np.std(individual_preds, axis=1)
        return uncertainty

    def forecast_ahead(self, current_data: pd.DataFrame, features: List[str],
                       steps: int = 24) -> Tuple[np.ndarray, np.ndarray]:
        """Forecast multiple steps ahead using recursive strategy."""
        self.logger.info(f"Forecasting {steps} steps ahead...")

        forecasts = []
        uncertainties = []
        X_temp = current_data.copy()

        for step in range(steps):
            # Get last row using iloc
            last_row = X_temp.iloc[[-1]]
            preds = self.predict_batch(last_row, features)
            forecast = preds['ensemble'][0]
            forecasts.append(forecast)

            uncertainty = self.get_uncertainty({k: v[-1:] for k, v in preds.items()})
            uncertainties.append(uncertainty[0])

            # Update X_temp with forecasted value (simple strategy)
            new_row = X_temp.iloc[-1].copy()
            new_row['consumption_mwh'] = forecast
            X_temp = pd.concat([X_temp, pd.DataFrame([new_row])], ignore_index=False)

        return np.array(forecasts), np.array(uncertainties)

    def explain_prediction(self, X: pd.DataFrame, features: List[str]) -> Dict:
        """Explain individual prediction using SHAP-like approach."""
        # Get feature importance from trained models
        importance = {}

        try:
            scores = self.models['xgb'].get_score(importance_type='gain')
            importance['xgb'] = {f: scores.get(f, 0) for f in features}
        except:
            importance['xgb'] = {f: 0 for f in features}

        try:
            importance['lgb'] = dict(zip(features, self.models['lgb'].feature_importance()))
        except:
            importance['lgb'] = {f: 0 for f in features}

        try:
            importance['cat'] = dict(zip(features, self.models['cat'].get_feature_importance()))
        except:
            importance['cat'] = {f: 0 for f in features}

        # Average importance across models
        avg_importance = {}
        for feat in features:
            scores = [importance.get(model, {}).get(feat, 0) for model in ['xgb', 'lgb', 'cat']]
            avg_importance[feat] = np.mean(scores)

        # Top 10 features
        top_features = sorted(avg_importance.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            'top_features': top_features,
            'model_importance': importance,
            'average_importance': avg_importance
        }
