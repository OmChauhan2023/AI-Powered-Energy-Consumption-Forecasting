"""Pipeline Orchestrator: Coordinates all agents in a unified ML workflow."""
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple
import sys

from .data_agent import DataAgent
from .training_agent import TrainingAgent
from .inference_agent import InferenceAgent
from .monitoring_agent import MonitoringAgent


class PipelineOrchestrator:
    """Master orchestrator managing full ML pipeline."""

    def __init__(self, config: Dict = None):
        self.config = config or self._default_config()
        self.logger = self._setup_logger()

        # Initialize agents
        self.data_agent = DataAgent(self.config['data_path'])
        self.training_agent = TrainingAgent(self.config['model_dir'], self.config['output_dir'])
        self.inference_agent = InferenceAgent(self.config['model_dir'])
        self.monitoring_agent = MonitoringAgent(self.config['monitoring_dir'])

        self.logger.info("Pipeline Orchestrator initialized")

    @staticmethod
    def _default_config() -> Dict:
        """Default configuration."""
        return {
            'data_path': 'data/energy_consumption.csv',
            'model_dir': 'models',
            'output_dir': 'outputs',
            'monitoring_dir': 'outputs/monitoring',
            'train_ratio': 0.7,
            'val_ratio': 0.15,
            'test_ratio': 0.15,
            'n_top_features': 35,
        }

    def _setup_logger(self):
        import logging
        logger = logging.getLogger("Orchestrator")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter("[Orchestrator] %(message)s")
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    def run_full_pipeline(self) -> Dict:
        """Execute full training pipeline."""
        self.logger.info("=" * 60)
        self.logger.info("Starting Full Training Pipeline")
        self.logger.info("=" * 60)

        try:
            # Step 1: Data Loading & Preprocessing
            self.logger.info("\n[STEP 1] Data Loading & Preprocessing")
            df = self.data_agent.load_data()
            self.data_agent.validate_data(df)

            df = self.data_agent.preprocess(df)
            df = self.data_agent.add_advanced_features(df)

            # Step 2: Data Splitting
            self.logger.info("\n[STEP 2] Data Splitting")
            train, val, test = self.data_agent.split_data(
                df,
                self.config['train_ratio'],
                self.config['val_ratio'],
                self.config['test_ratio']
            )

            features = self.data_agent.get_feature_columns(train)
            self.logger.info(f"Using {len(features)} features")

            # Step 3: Model Training
            self.logger.info("\n[STEP 3] Training Individual Models")
            X_train, y_train = train[features], train['consumption_mwh']
            X_val, y_val = val[features], val['consumption_mwh']
            X_test, y_test = test[features], test['consumption_mwh']

            models_dict = {
                'xgb': self.training_agent.train_xgboost(X_train, y_train, X_val, y_val, features),
                'lgb': self.training_agent.train_lightgbm(X_train, y_train, X_val, y_val, features),
                'cat': self.training_agent.train_catboost(X_train, y_train, X_val, y_val, features),
            }

            # Step 4: Ensemble Weight Optimization
            self.logger.info("\n[STEP 4] Ensemble Weight Optimization")
            preds_val = self.training_agent.predict_ensemble(models_dict, X_val, features)
            weights = self.training_agent.optimize_ensemble_weights(preds_val, y_val)

            # Step 5: Model Evaluation
            self.logger.info("\n[STEP 5] Model Evaluation")
            preds_test = self.training_agent.predict_ensemble(models_dict, X_test, features)

            results = {
                'train_size': len(X_train),
                'val_size': len(X_val),
                'test_size': len(X_test),
                'n_features': len(features),
                'individual_models': {},
                'ensemble': {},
            }

            # Individual model evaluation
            for model_name, preds in preds_test.items():
                mae = np.mean(np.abs(preds - y_test))
                rmse = np.sqrt(np.mean((preds - y_test) ** 2))
                y_test_arr = np.array(y_test)
                mask = y_test_arr != 0
                mape = np.mean(np.abs((y_test_arr[mask] - preds[mask]) / y_test_arr[mask])) * 100

                results['individual_models'][model_name] = {
                    'mae': float(mae),
                    'rmse': float(rmse),
                    'mape': float(mape)
                }

                print(f"\n{'='*50}")
                print(f"  {model_name.upper()} - Performance Metrics")
                print(f"{'='*50}")
                print(f"  MAE  (Mean Absolute Error):    {mae:,.4f}")
                print(f"  RMSE (Root Mean Squared Error): {rmse:,.4f}")
                print(f"  MAPE (Mean Absolute % Error):  {mape:.4f}%")
                print(f"{'='*50}")
                self.logger.info(f"{model_name.upper()}: MAE={mae:.4f}, RMSE={rmse:.4f}, MAPE={mape:.4f}%")

            # Ensemble evaluation
            w = weights / weights.sum()
            ensemble_pred = sum(w[i] * preds_test[k] for i, k in enumerate(['xgb', 'lgb', 'cat']))
            ensemble_mae = np.mean(np.abs(ensemble_pred - y_test))
            ensemble_rmse = np.sqrt(np.mean((ensemble_pred - y_test) ** 2))
            y_test_arr = np.array(y_test)
            mask = y_test_arr != 0
            ensemble_mape = np.mean(np.abs((y_test_arr[mask] - ensemble_pred[mask]) / y_test_arr[mask])) * 100

            results['ensemble']['mae'] = float(ensemble_mae)
            results['ensemble']['rmse'] = float(ensemble_rmse)
            results['ensemble']['mape'] = float(ensemble_mape)
            results['ensemble']['weights'] = {
                'xgb': float(w[0]),
                'lgb': float(w[1]),
                'cat': float(w[2])
            }

            print(f"\n{'='*50}")
            print(f"  ENSEMBLE - Performance Metrics")
            print(f"{'='*50}")
            print(f"  MAE  (Mean Absolute Error):    {ensemble_mae:,.4f}")
            print(f"  RMSE (Root Mean Squared Error): {ensemble_rmse:,.4f}")
            print(f"  MAPE (Mean Absolute % Error):  {ensemble_mape:.4f}%")
            print(f"{'='*50}")
            self.logger.info(f"ENSEMBLE: MAE={ensemble_mae:.4f}, RMSE={ensemble_rmse:.4f}, MAPE={ensemble_mape:.4f}%")

            # Step 6: Monitoring
            self.logger.info("\n[STEP 6] Monitoring & Quality Check")
            self.monitoring_agent.check_data_quality(test)
            self.monitoring_agent.evaluate_predictions(y_test.values, ensemble_pred, 'ensemble')
            self.monitoring_agent.detect_drift(y_test.values, ensemble_pred)
            self.monitoring_agent.detect_outliers(y_test.values - ensemble_pred)

            # Step 7: Save Models
            self.logger.info("\n[STEP 7] Saving Models & Artifacts")
            self.training_agent.save_models(models_dict, weights)
            self.monitoring_agent.save_metrics()

            self.logger.info("\n" + "=" * 60)
            self.logger.info("✓ Pipeline Completed Successfully")
            self.logger.info("=" * 60)

            return results

        except Exception as e:
            self.logger.error(f"Pipeline failed: {e}", exc_info=True)
            raise

    def run_inference_pipeline(self, input_df: pd.DataFrame = None) -> Dict:
        """Run inference pipeline on new data."""
        self.logger.info("\n[INFERENCE] Starting Inference Pipeline")

        try:
            # Load data if not provided
            if input_df is None:
                df = self.data_agent.load_data()
                df = self.data_agent.preprocess(df)
                df = self.data_agent.add_advanced_features(df)
                input_df = df.iloc[-1:].copy()

            features = self.data_agent.get_feature_columns(input_df)

            # Load models
            if not self.inference_agent.load_models():
                raise RuntimeError("Failed to load trained models")

            # Predict
            pred, details = self.inference_agent.predict_single(input_df, features)
            uncertainty = self.inference_agent.get_uncertainty({
                'xgb': np.array([details['xgb']]),
                'lgb': np.array([details['lgb']]),
                'cat': np.array([details['cat']])
            })

            # Explain
            explanation = self.inference_agent.explain_prediction(input_df, features)

            results = {
                'prediction': float(pred),
                'uncertainty': float(uncertainty[0]),
                'details': details,
                'top_features': explanation['top_features'][:5],
                'timestamp': datetime.now().isoformat()
            }

            self.logger.info(f"Prediction: {pred:.4f} ± {uncertainty[0]:.4f}")
            return results

        except Exception as e:
            self.logger.error(f"Inference pipeline failed: {e}", exc_info=True)
            raise

    def run_forecast_pipeline(self, horizon: int = 24) -> Dict:
        """Generate forecast for multiple steps ahead."""
        self.logger.info(f"\n[FORECAST] Generating {horizon}-step forecast")

        try:
            # Load and prepare data
            df = self.data_agent.load_data()
            df = self.data_agent.preprocess(df)
            df = self.data_agent.add_advanced_features(df)

            features = self.data_agent.get_feature_columns(df)

            # Load models
            if not self.inference_agent.load_models():
                raise RuntimeError("Failed to load trained models")

            # Forecast
            forecasts, uncertainties = self.inference_agent.forecast_ahead(df, features, horizon)

            results = {
                'forecasts': forecasts.tolist(),
                'uncertainties': uncertainties.tolist(),
                'horizon': horizon,
                'timestamp': datetime.now().isoformat()
            }

            self.logger.info(f"Forecast completed: next {horizon} hours")
            return results

        except Exception as e:
            self.logger.error(f"Forecast pipeline failed: {e}", exc_info=True)
            raise

    def get_monitoring_summary(self) -> Dict:
        """Get monitoring summary."""
        perf = self.monitoring_agent.get_performance_summary(24)
        alerts = self.monitoring_agent.get_alerts(10)

        return {
            'performance': perf,
            'recent_alerts': alerts,
            'timestamp': datetime.now().isoformat()
        }


if __name__ == "__main__":
    orchestrator = PipelineOrchestrator()
    results = orchestrator.run_full_pipeline()
    print("\nFinal Results:")
    print(results)
