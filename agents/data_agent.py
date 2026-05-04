"""Data Agent: Handles data loading, preprocessing, and validation."""
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from src.preprocessing import (
    load_raw, fill_gaps, add_time_features,
    add_lag_features, add_rolling_features, flag_anomalies
)


class DataAgent:
    """Manages data pipeline: loading, preprocessing, feature engineering."""

    def __init__(self, data_path: str = "data/energy_consumption.csv"):
        self.data_path = Path(data_path)
        self.logger = self._setup_logger()

    def _setup_logger(self):
        """Simple logging setup."""
        import logging
        logger = logging.getLogger("DataAgent")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter("[DataAgent] %(message)s")
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    def load_data(self) -> pd.DataFrame:
        """Load and validate raw data."""
        if not self.data_path.exists():
            raise FileNotFoundError(f"Data file not found: {self.data_path}")

        self.logger.info(f"Loading data from {self.data_path}")
        df = load_raw(str(self.data_path))
        self.logger.info(f"Loaded {len(df)} records from {df.index.min()} to {df.index.max()}")
        return df

    def preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        """Full preprocessing pipeline."""
        self.logger.info("Starting preprocessing...")

        df = fill_gaps(df)
        self.logger.info(f"Filled gaps: {len(df)} records")

        df = flag_anomalies(df)         # IQR-based anomaly flags
        self.logger.info(f"Flagged anomalies: {df['is_anomaly'].sum()} rows")

        df = add_time_features(df)      # incl. is_holiday, is_morning, is_evening, AU seasons
        self.logger.info("Added time features")

        df = add_lag_features(df)
        self.logger.info("Added lag features")

        df = add_rolling_features(df)
        self.logger.info("Added rolling features")

        df = df.dropna()
        self.logger.info(f"Dropped NaN rows: {len(df)} records remaining")

        return df

    def add_advanced_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add EWM, COVID flags, and interaction features."""
        df = df.copy()

        # Exponential weighted mean (lag-shifted to avoid leakage)
        df['ewm_12h'] = df['consumption_mwh'].shift(1).ewm(span=12).mean()
        df['ewm_24h'] = df['consumption_mwh'].shift(1).ewm(span=24).mean()

        # Interaction features
        df['hour_weekend_interaction'] = df['hour'] * df['is_weekend']
        df['lag_24h_times_hour'] = (
            df['lag_24h'] * df['hour'] if 'lag_24h' in df.columns else 0
        )
        if 'is_covid' in df.columns and 'is_weekend' in df.columns:
            df['covid_x_weekend'] = df['is_covid'] * df['is_weekend']
        if 'is_holiday' in df.columns:
            df['holiday_x_weekend'] = df['is_holiday'] * df['is_weekend']

        return df

    # ------------------------------------------------------------------
    def select_top_features_shap(
        self,
        model,                     # fitted XGBoost / LightGBM / CatBoost estimator
        X_train: pd.DataFrame,
        feature_cols: list,
        top_n: int = 30,
        model_type: str = 'xgb',   # 'xgb' | 'lgb' | 'cat'
    ) -> list:
        """
        Use SHAP to rank features and return the top-N most impactful ones.
        Falls back to built-in feature importance if SHAP is unavailable.
        """
        try:
            import shap
            if model_type == 'lgb':
                explainer = shap.TreeExplainer(model)
            else:
                explainer = shap.TreeExplainer(model)

            # Sample for speed (max 5 000 rows)
            sample = X_train[feature_cols].iloc[:5000]
            shap_values = explainer.shap_values(sample)
            mean_abs = np.abs(shap_values).mean(axis=0)
            importance = pd.Series(mean_abs, index=feature_cols).sort_values(ascending=False)
            self.logger.info(f"SHAP top-{top_n} features selected")
        except Exception as e:
            self.logger.warning(f"SHAP unavailable ({e}); using built-in importance")
            try:
                scores = pd.Series(
                    model.feature_importances_, index=feature_cols
                ).sort_values(ascending=False)
            except Exception:
                scores = pd.Series(
                    {f: i for i, f in enumerate(reversed(feature_cols))}
                )
            importance = scores

        top_features = importance.head(top_n).index.tolist()
        self.logger.info(f"Selected {len(top_features)} features: {top_features[:5]} ...")
        return top_features

    def split_data(self, df: pd.DataFrame, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15):
        """Chronological train/val/test split."""
        n = len(df)
        train_size = int(n * train_ratio)
        val_size = int(n * val_ratio)

        train = df.iloc[:train_size]
        val = df.iloc[train_size:train_size + val_size]
        test = df.iloc[train_size + val_size:]

        self.logger.info(f"Split: Train={len(train)}, Val={len(val)}, Test={len(test)}")

        return train, val, test

    def get_feature_columns(self, df: pd.DataFrame, exclude_target=True):
        """Get list of feature columns (exclude target and index)."""
        exclude = {'consumption_mwh'} if exclude_target else set()
        features = [col for col in df.columns if col not in exclude]
        return features

    def validate_data(self, df: pd.DataFrame) -> dict:
        """Validate data quality."""
        stats = {
            'n_records': len(df),
            'n_features': df.shape[1],
            'date_range': f"{df.index.min()} to {df.index.max()}",
            'missing_values': df.isnull().sum().sum(),
            'memory_mb': df.memory_usage(deep=True).sum() / 1024**2
        }
        self.logger.info(f"Data validation: {stats}")
        return stats
