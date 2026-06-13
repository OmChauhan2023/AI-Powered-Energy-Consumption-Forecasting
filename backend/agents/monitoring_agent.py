"""Monitoring Agent: Handles performance tracking, alerts, and drift detection."""
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
import json


class MonitoringAgent:
    """Monitors model performance, data drift, and generates alerts."""

    def __init__(self, output_dir: str = "outputs/monitoring"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logger = self._setup_logger()
        self.metrics_history = []
        self.alerts = []

    def _setup_logger(self):
        import logging
        logger = logging.getLogger("MonitoringAgent")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter("[MonitoringAgent] %(message)s")
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    def evaluate_predictions(self, y_true: np.ndarray, y_pred: np.ndarray,
                            model_name: str = 'ensemble', timestamp: datetime = None) -> dict:
        """Evaluate and log prediction metrics."""
        if timestamp is None:
            timestamp = datetime.now()

        mae = np.mean(np.abs(y_true - y_pred))
        rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
        mape = np.mean(np.abs((y_true - y_pred) / (np.abs(y_true) + 1e-8))) * 100
        mse = np.mean((y_true - y_pred) ** 2)

        metrics = {
            'timestamp': timestamp.isoformat(),
            'model': model_name,
            'samples': len(y_true),
            'mae': float(mae),
            'rmse': float(rmse),
            'mape': float(mape),
            'mse': float(mse),
        }

        self.metrics_history.append(metrics)
        self.logger.info(f"{model_name} - MAE: {mae:.4f}, RMSE: {rmse:.4f}, MAPE: {mape:.4f}")

        return metrics

    def detect_drift(self, y_true: np.ndarray, y_pred: np.ndarray,
                    threshold_mae: float = 50.0, threshold_std: float = 3.0) -> dict:
        """Detect data drift and prediction drift."""
        errors = np.abs(y_true - y_pred)
        error_mean = np.mean(errors)
        error_std = np.std(errors)

        mae_drift = error_mean > threshold_mae
        std_drift = error_std > threshold_std

        drift_info = {
            'error_mean': float(error_mean),
            'error_std': float(error_std),
            'mae_drift_detected': bool(mae_drift),
            'std_drift_detected': bool(std_drift),
            'threshold_mae': threshold_mae,
            'threshold_std': threshold_std,
        }

        if mae_drift or std_drift:
            alert = {
                'timestamp': datetime.now().isoformat(),
                'severity': 'HIGH' if (mae_drift and std_drift) else 'MEDIUM',
                'type': 'DRIFT_DETECTED',
                'details': drift_info
            }
            self.alerts.append(alert)
            self.logger.warning(f"Drift detected: {alert}")

        return drift_info

    def detect_outliers(self, residuals: np.ndarray, threshold_std: float = 3.0) -> dict:
        """Detect outlier predictions."""
        mean = np.mean(residuals)
        std = np.std(residuals)
        z_scores = np.abs((residuals - mean) / (std + 1e-8))
        outliers = z_scores > threshold_std

        outlier_info = {
            'n_outliers': int(np.sum(outliers)),
            'outlier_percentage': float(np.sum(outliers) / len(residuals) * 100),
            'threshold_std': threshold_std,
            'outlier_indices': np.where(outliers)[0].tolist()[:100],  # First 100
        }

        if outlier_info['n_outliers'] > 0:
            alert = {
                'timestamp': datetime.now().isoformat(),
                'severity': 'MEDIUM',
                'type': 'OUTLIERS_DETECTED',
                'details': outlier_info
            }
            self.alerts.append(alert)
            self.logger.warning(f"Outliers detected: {outlier_info['n_outliers']} anomalies")

        return outlier_info

    def check_data_quality(self, df: pd.DataFrame, target_col: str = 'consumption_mwh') -> dict:
        """Check data quality metrics."""
        quality = {
            'total_rows': len(df),
            'missing_values': int(df.isnull().sum().sum()),
            'missing_percentage': float(df.isnull().sum().sum() / (df.shape[0] * df.shape[1]) * 100),
            'duplicate_rows': int(df.duplicated().sum()),
            'target_stats': {
                'mean': float(df[target_col].mean()),
                'std': float(df[target_col].std()),
                'min': float(df[target_col].min()),
                'max': float(df[target_col].max()),
            }
        }

        if quality['missing_percentage'] > 1.0:
            alert = {
                'timestamp': datetime.now().isoformat(),
                'severity': 'MEDIUM',
                'type': 'DATA_QUALITY',
                'details': {'missing_percentage': quality['missing_percentage']}
            }
            self.alerts.append(alert)
            self.logger.warning(f"Data quality issue: {quality['missing_percentage']:.2f}% missing")

        self.logger.info(f"Data quality: {quality}")
        return quality

    def get_performance_summary(self, window_hours: int = 24) -> dict:
        """Get performance summary over recent window."""
        cutoff = datetime.now() - timedelta(hours=window_hours)
        recent_metrics = [m for m in self.metrics_history
                         if datetime.fromisoformat(m['timestamp']) > cutoff]

        if not recent_metrics:
            return {
                'n_evaluations': 0,
                'avg_mae': 0,
                'avg_rmse': 0,
                'avg_mape': 0,
                'models': {}
            }

        summary = {
            'n_evaluations': len(recent_metrics),
            'avg_mae': float(np.mean([m['mae'] for m in recent_metrics])),
            'max_mae': float(np.max([m['mae'] for m in recent_metrics])),
            'min_mae': float(np.min([m['mae'] for m in recent_metrics])),
            'std_mae': float(np.std([m['mae'] for m in recent_metrics])),
            'avg_rmse': float(np.mean([m['rmse'] for m in recent_metrics])),
            'avg_mape': float(np.mean([m['mape'] for m in recent_metrics])),
            'time_window_hours': window_hours,
        }

        self.logger.info(f"Performance summary (last {window_hours}h): {summary}")
        return summary

    def get_alerts(self, limit: int = 100) -> list:
        """Get recent alerts."""
        return self.alerts[-limit:]

    def clear_alerts(self):
        """Clear alert history."""
        self.alerts = []
        self.logger.info("Alerts cleared")

    def save_metrics(self, filename: str = 'monitoring_metrics.json'):
        """Save metrics and alerts to file."""
        path = self.output_dir / filename
        data = {
            'metrics': self.metrics_history,
            'alerts': self.alerts,
            'saved_at': datetime.now().isoformat()
        }
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        self.logger.info(f"Metrics saved to {path}")

    def load_metrics(self, filename: str = 'monitoring_metrics.json'):
        """Load metrics from file."""
        path = self.output_dir / filename
        if path.exists():
            with open(path, 'r') as f:
                data = json.load(f)
            self.metrics_history = data.get('metrics', [])
            self.alerts = data.get('alerts', [])
            self.logger.info(f"Metrics loaded from {path}")
            return True
        return False
