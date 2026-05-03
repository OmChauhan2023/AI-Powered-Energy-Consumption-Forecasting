import pandas as pd
import numpy as np


def load_raw(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=['Start time UTC', 'End time UTC'])
    df.columns = ['start_utc', 'end_utc', 'consumption_mwh']
    df = df.set_index('start_utc').sort_index()[['consumption_mwh']]
    return df


def fill_gaps(df: pd.DataFrame) -> pd.DataFrame:
    full_idx = pd.date_range(start=df.index.min(), end=df.index.max(), freq='h')
    df = df.reindex(full_idx)
    df.index.name = 'timestamp'
    df['consumption_mwh'] = df['consumption_mwh'].interpolate(method='time')
    return df


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['hour']        = df.index.hour
    df['day_of_week'] = df.index.dayofweek
    df['day_of_year'] = df.index.dayofyear
    df['week']        = df.index.isocalendar().week.astype(int)
    df['month']       = df.index.month
    df['year']        = df.index.year
    df['quarter']     = df.index.quarter
    df['is_weekend']  = (df['day_of_week'] >= 5).astype(int)
    # Cyclic encoding (preserves circular nature of time)
    df['hour_sin']    = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos']    = np.cos(2 * np.pi * df['hour'] / 24)
    df['month_sin']   = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos']   = np.cos(2 * np.pi * df['month'] / 12)
    df['dow_sin']     = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['dow_cos']     = np.cos(2 * np.pi * df['day_of_week'] / 7)
    return df


def add_lag_features(df: pd.DataFrame, lags=(1, 2, 3, 6, 12, 24, 48, 168)) -> pd.DataFrame:
    df = df.copy()
    for lag in lags:
        df[f'lag_{lag}h'] = df['consumption_mwh'].shift(lag)
    return df


def add_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for window in [24, 168]:
        df[f'roll_mean_{window}h'] = df['consumption_mwh'].shift(1).rolling(window).mean()
        df[f'roll_std_{window}h']  = df['consumption_mwh'].shift(1).rolling(window).std()
    return df


def preprocess(raw_path: str) -> pd.DataFrame:
    df = load_raw(raw_path)
    df = fill_gaps(df)
    df = add_time_features(df)
    df = add_lag_features(df)
    df = add_rolling_features(df)
    df = df.dropna()
    return df
