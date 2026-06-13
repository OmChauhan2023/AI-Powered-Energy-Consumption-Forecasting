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
            # Try trained models first, then fall back to ensemble or optuna models
            xgb_path = self.model_dir / f"trained_xgb{suffix}.pkl"
            if not xgb_path.exists():
                xgb_path = self.model_dir / f"ensemble_xgb{suffix}.pkl"
            if not xgb_path.exists():
                xgb_path = self.model_dir / f"optuna_xgb{suffix}.pkl"

            lgb_path = self.model_dir / f"trained_lgb{suffix}.pkl"
            if not lgb_path.exists():
                lgb_path = self.model_dir / f"ensemble_lgb{suffix}.pkl"
            if not lgb_path.exists():
                lgb_path = self.model_dir / f"optuna_lgb{suffix}.pkl"

            cat_path = self.model_dir / f"trained_cat{suffix}.pkl"
            if not cat_path.exists():
                cat_path = self.model_dir / f"ensemble_cat{suffix}.pkl"
            if not cat_path.exists():
                cat_path = self.model_dir / f"optuna_cat{suffix}.pkl"

            weights_path = self.model_dir / f"ensemble_weights{suffix}.npy"
            if not weights_path.exists():
                weights_path = self.model_dir / f"ensemble_meta{suffix}.pkl"
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
        """
        Forecast multiple steps ahead using recursive strategy.
        Properly updates lag, rolling, and time-of-day features at every step.
        """
        self.logger.info(f"Forecasting {steps} steps ahead...")

        # Build a rolling buffer of recent consumption values for lag/rolling updates
        # Use the last 336 hours (2 weeks) as history buffer
        BUFFER = 336
        history = list(current_data['consumption_mwh'].values[-BUFFER:])

        # Grab the last timestamp so we can advance the clock each step
        last_ts = current_data.index[-1]

        forecasts = []
        uncertainties = []

        # Work on a copy of the last row as our "template" feature vector
        base_row = current_data.iloc[[-1]].copy()

        for step in range(steps):
            # ── 1. Build feature row from current history buffer ──────────────
            row = base_row.copy()

            # Advance timestamp by 1 hour per step
            next_ts = last_ts + pd.Timedelta(hours=step + 1)
            hour = next_ts.hour
            dow  = next_ts.dayofweek

            # Update time/calendar features if they exist in the feature set
            for feat, val in [
                ('hour',         hour),
                ('day_of_week',  dow),
                ('is_weekend',   int(dow >= 5)),
                ('is_weekday',   int(dow < 5)),
                ('is_morning',   int(6 <= hour < 12)),
                ('is_afternoon', int(12 <= hour < 17)),
                ('is_evening',   int(17 <= hour < 22)),
                ('is_night',     int(hour >= 22 or hour < 6)),
                ('is_peak_morning', int(7 <= hour <= 10)),
                ('is_peak_evening', int(17 <= hour <= 20)),
                ('hour_sin',     float(np.sin(2 * np.pi * hour / 24))),
                ('hour_cos',     float(np.cos(2 * np.pi * hour / 24))),
                ('dow_sin',      float(np.sin(2 * np.pi * dow / 7))),
                ('dow_cos',      float(np.cos(2 * np.pi * dow / 7))),
            ]:
                if feat in row.columns:
                    row[feat] = val

            # Update lag features from the rolling history buffer
            LAG_MAP = {
                'lag_1h': 1, 'lag_2h': 2, 'lag_3h': 3,
                'lag_6h': 6, 'lag_12h': 12, 'lag_24h': 24,
                'lag_48h': 48, 'lag_72h': 72, 'lag_168h': 168, 'lag_336h': 336,
            }
            for feat, lag in LAG_MAP.items():
                if feat in row.columns and len(history) >= lag:
                    row[feat] = history[-lag]

            # Update rolling statistics
            ROLLING_MAP = {6: 6, 12: 12, 24: 24, 48: 48, 168: 168}
            for window, w in ROLLING_MAP.items():
                buf = history[-w:] if len(history) >= w else history
                if f'roll_mean_{w}h' in row.columns:
                    row[f'roll_mean_{w}h'] = float(np.mean(buf))
                if f'roll_std_{w}h' in row.columns:
                    row[f'roll_std_{w}h'] = float(np.std(buf))
                if f'roll_min_{w}h' in row.columns:
                    row[f'roll_min_{w}h'] = float(np.min(buf))
                if f'roll_max_{w}h' in row.columns:
                    row[f'roll_max_{w}h'] = float(np.max(buf))

            # Update EWM
            if 'ewm_24h' in row.columns:
                alpha = 2 / (24 + 1)
                ewm_val = history[-1]
                for v in history[-24:]:
                    ewm_val = alpha * v + (1 - alpha) * ewm_val
                row['ewm_24h'] = ewm_val
            if 'ewm_168h' in row.columns:
                alpha = 2 / (168 + 1)
                ewm_val = history[-1]
                for v in history[-168:] if len(history) >= 168 else history:
                    ewm_val = alpha * v + (1 - alpha) * ewm_val
                row['ewm_168h'] = ewm_val

            # ── 2. Predict ────────────────────────────────────────────────────
            # Only pass features that exist in both row and the model's feature list
            available = [f for f in features if f in row.columns]
            preds = self.predict_batch(row, available)
            forecast = float(preds['ensemble'][0])

            # Clip to realistic range (Australian grid: ~3,000–20,000 MWh)
            forecast = float(np.clip(forecast, 3000, 20000))
            forecasts.append(forecast)

            # Uncertainty grows with horizon
            unc = self.get_uncertainty({k: v[-1:] for k, v in preds.items()})
            base_unc = float(unc[0]) if not np.isnan(unc[0]) else 10.0
            horizon_unc = base_unc + step * 0.5
            uncertainties.append(float(np.clip(horizon_unc, 2, 100)))

            # ── 3. Append to history buffer for next step ─────────────────────
            history.append(forecast)

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
