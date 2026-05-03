"""Data Agent: Handles data loading, preprocessing, and validation."""
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from src.preprocessing import (
    load_raw, fill_gaps, add_time_features,
    add_lag_features, add_rolling_features
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

        df = add_time_features(df)
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

        # Exponential weighted mean
        df['ewm_12h'] = df['consumption_mwh'].ewm(span=12).mean()
        df['ewm_24h'] = df['consumption_mwh'].ewm(span=24).mean()

        # COVID flags (2020-2021)
        df['is_covid'] = ((df.index >= '2020-03-01') & (df.index <= '2021-06-30')).astype(int)

        # Interaction features
        df['hour_weekend_interaction'] = df['hour'] * df['is_weekend']
        df['lag_24h_times_hour'] = df['lag_24h'] * df['hour'] if 'lag_24h' in df.columns else 0

        return df

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
