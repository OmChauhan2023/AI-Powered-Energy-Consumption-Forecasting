import pandas as pd
import numpy as np
try:
    import holidays as hol_lib
    _HOLIDAYS_AVAILABLE = True
except ImportError:
    _HOLIDAYS_AVAILABLE = False


# ─── Australian public + festival holidays ────────────────────────────────────
def _build_au_holidays(years):
    """Return a set of date objects for Australian national + state (VIC) holidays."""
    if not _HOLIDAYS_AVAILABLE:
        return set()
    au = hol_lib.country_holidays('AU', subdiv='VIC', years=years)
    return set(au.keys())


# ─── Timestamp normalisation ───────────────────────────────────────────────────
def _round_to_hour(ts: pd.Timestamp) -> pd.Timestamp:
    """Round a timestamp to the nearest hour (handles :05 dataset artefact)."""
    return ts.round('h')


def load_raw(path: str) -> pd.DataFrame:
    """Load CSV, normalise timestamps to the hour, remove duplicates."""
    df = pd.read_csv(path, parse_dates=['Start time UTC', 'End time UTC'])
    df.columns = ['start_utc', 'end_utc', 'consumption_mwh']

    # Fix :05 (or any off-minute) timestamps → round to nearest hour
    df['start_utc'] = df['start_utc'].dt.round('h')

    df = (
        df.set_index('start_utc')
          .sort_index()[['consumption_mwh']]
          .loc[~df.set_index('start_utc').index.duplicated(keep='first')]  # drop any dups after rounding
    )
    return df


def fill_gaps(df: pd.DataFrame) -> pd.DataFrame:
    """Reindex to hourly frequency and interpolate missing values."""
    full_idx = pd.date_range(start=df.index.min(), end=df.index.max(), freq='h')
    df = df.reindex(full_idx)
    df.index.name = 'timestamp'
    df['consumption_mwh'] = df['consumption_mwh'].interpolate(method='time')
    return df


# ─── Anomaly / outlier detection ──────────────────────────────────────────────
def flag_anomalies(df: pd.DataFrame, col: str = 'consumption_mwh',
                   iqr_multiplier: float = 2.5) -> pd.DataFrame:
    """
    Flag rows where `col` is outside [Q1 - k·IQR, Q3 + k·IQR].
    Adds binary column `is_anomaly` and `anomaly_z_score`.
    Does NOT remove rows — the model can learn to handle them.
    """
    df = df.copy()
    Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
    IQR = Q3 - Q1
    lo, hi = Q1 - iqr_multiplier * IQR, Q3 + iqr_multiplier * IQR
    df['is_anomaly'] = ((df[col] < lo) | (df[col] > hi)).astype(int)
    mu, sigma = df[col].mean(), df[col].std()
    df['anomaly_z_score'] = ((df[col] - mu) / (sigma + 1e-8)).round(4)
    return df


# ─── Feature engineering ──────────────────────────────────────────────────────
def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Core time + seasonal features aligned to Australian climate."""
    df = df.copy()
    idx = df.index

    df['hour']        = idx.hour
    df['day_of_week'] = idx.dayofweek
    df['day_of_year'] = idx.dayofyear
    df['week']        = idx.isocalendar().week.astype(int)
    df['month']       = idx.month
    df['year']        = idx.year
    df['quarter']     = idx.quarter

    # ── Weekend / weekday
    df['is_weekend']  = (df['day_of_week'] >= 5).astype(int)
    df['is_weekday']  = (df['day_of_week'] < 5).astype(int)

    # ── Time-of-day segments
    df['is_morning']  = ((df['hour'] >= 6) & (df['hour'] < 12)).astype(int)
    df['is_afternoon']= ((df['hour'] >= 12) & (df['hour'] < 17)).astype(int)
    df['is_evening']  = ((df['hour'] >= 17) & (df['hour'] < 22)).astype(int)
    df['is_night']    = ((df['hour'] >= 22) | (df['hour'] < 6)).astype(int)

    # Peak-load windows
    df['is_peak_morning'] = ((df['hour'] >= 7) & (df['hour'] <= 10)).astype(int)
    df['is_peak_evening'] = ((df['hour'] >= 17) & (df['hour'] <= 20)).astype(int)
    df['is_business_hour']= ((df['hour'] >= 8) & (df['hour'] <= 18)
                             & (df['is_weekday'] == 1)).astype(int)

    # ── Australian seasons (Southern Hemisphere)
    #    Summer: Dec-Feb  |  Autumn: Mar-May  |  Winter: Jun-Aug  |  Spring: Sep-Nov
    def _au_season(month):
        if month in [12, 1, 2]:  return 'Summer'
        if month in [3, 4, 5]:   return 'Autumn'
        if month in [6, 7, 8]:   return 'Winter'
        return 'Spring'

    df['au_season']    = df['month'].map(_au_season)
    df['is_au_summer'] = (df['au_season'] == 'Summer').astype(int)
    df['is_au_autumn'] = (df['au_season'] == 'Autumn').astype(int)
    df['is_au_winter'] = (df['au_season'] == 'Winter').astype(int)
    df['is_au_spring'] = (df['au_season'] == 'Spring').astype(int)

    # ── Cyclic encoding (preserves circular nature of time)
    df['hour_sin']  = np.sin(2 * np.pi * df['hour']        / 24)
    df['hour_cos']  = np.cos(2 * np.pi * df['hour']        / 24)
    df['month_sin'] = np.sin(2 * np.pi * df['month']       / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month']       / 12)
    df['dow_sin']   = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['dow_cos']   = np.cos(2 * np.pi * df['day_of_week'] / 7)
    df['doy_sin']   = np.sin(2 * np.pi * df['day_of_year'] / 365)
    df['doy_cos']   = np.cos(2 * np.pi * df['day_of_year'] / 365)

    # ── Public / festival holidays (Australian calendar)
    years = list(range(int(idx.year.min()), int(idx.year.max()) + 2))
    holiday_dates = _build_au_holidays(years)
    df['is_holiday'] = idx.normalize().map(lambda d: int(d.date() in holiday_dates))

    # ── COVID-19 period
    df['is_covid'] = ((idx >= '2020-03-01') & (idx <= '2021-06-30')).astype(int)

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


# ─── Full pipeline ─────────────────────────────────────────────────────────────
def preprocess(raw_path: str, flag_outliers: bool = True) -> pd.DataFrame:
    """
    Complete preprocessing pipeline.
      1. Load & round timestamps
      2. Fill hourly gaps
      3. Flag anomalies (does NOT drop them)
      4. Add all feature groups
      5. Drop rows with NaN (from lags / rolling)
    """
    df = load_raw(raw_path)
    df = fill_gaps(df)
    if flag_outliers:
        df = flag_anomalies(df)
    df = add_time_features(df)
    df = add_lag_features(df)
    df = add_rolling_features(df)
    df = df.dropna()
    return df
