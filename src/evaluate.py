import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error


def mape(y_true, y_pred) -> float:
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    mask = y_true != 0
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100


def smape(y_true, y_pred) -> float:
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    denom = (np.abs(y_true) + np.abs(y_pred)) / 2
    mask = denom != 0
    return np.mean(np.abs(y_true[mask] - y_pred[mask]) / denom[mask]) * 100


def get_core_metrics(y_true, y_pred) -> dict:
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    m    = mape(y_true, y_pred)
    return {'MAE': mae, 'RMSE': rmse, 'MAPE': m}


def report(y_true, y_pred, model_name: str = 'Model') -> dict:
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    m    = mape(y_true, y_pred)
    sm   = smape(y_true, y_pred)
    metrics = {'model': model_name, 'MAE': mae, 'RMSE': rmse, 'MAPE': m, 'SMAPE': sm}
    print(f"\n{'='*50}")
    print(f"  {model_name} - Performance Metrics")
    print(f"{'='*50}")
    print(f"  MAE  (Mean Absolute Error):    {mae:,.4f}")
    print(f"  RMSE (Root Mean Squared Error): {rmse:,.4f}")
    print(f"  MAPE (Mean Absolute % Error):  {m:,.4f}%")
    print(f"{'='*50}")
    return metrics
