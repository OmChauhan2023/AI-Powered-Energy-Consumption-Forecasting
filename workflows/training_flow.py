"""Prefect workflow for model training pipeline."""
from prefect import flow, task, get_run_logger
from prefect.tasks import task_input_hash
from datetime import datetime, timedelta
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import PipelineOrchestrator


@task(name="Initialize Orchestrator", retries=2)
def initialize_orchestrator():
    """Initialize the pipeline orchestrator."""
    logger = get_run_logger()
    logger.info("Initializing Pipeline Orchestrator...")
    orchestrator = PipelineOrchestrator()
    logger.info("Orchestrator initialized successfully")
    return orchestrator


@task(name="Load and Validate Data")
def load_data(orchestrator):
    """Load and validate data."""
    logger = get_run_logger()
    logger.info("Loading data...")
    df = orchestrator.data_agent.load_data()
    logger.info(f"Loaded {len(df)} records")

    quality = orchestrator.data_agent.validate_data(df)
    logger.info(f"Data quality: {quality}")
    return df


@task(name="Preprocess Data")
def preprocess_data(orchestrator, df):
    """Preprocess and engineer features."""
    logger = get_run_logger()
    logger.info("Preprocessing data...")

    df = orchestrator.data_agent.preprocess(df)
    df = orchestrator.data_agent.add_advanced_features(df)
    logger.info(f"Features engineered: {df.shape[1]} columns")
    return df


@task(name="Split Data")
def split_data(orchestrator, df):
    """Split data into train/val/test."""
    logger = get_run_logger()
    logger.info("Splitting data...")

    train, val, test = orchestrator.data_agent.split_data(df)
    logger.info(f"Train: {len(train)}, Val: {len(val)}, Test: {len(test)}")

    features = orchestrator.data_agent.get_feature_columns(train)
    logger.info(f"Features: {len(features)}")

    return train, val, test, features


@task(name="Train Models", retries=1)
def train_models(orchestrator, train, val, test, features):
    """Train individual models."""
    logger = get_run_logger()
    logger.info("Training models...")

    X_train, y_train = train[features], train['consumption_mwh']
    X_val, y_val = val[features], val['consumption_mwh']
    X_test, y_test = test[features], test['consumption_mwh']

    models_dict = {
        'xgb': orchestrator.training_agent.train_xgboost(X_train, y_train, X_val, y_val, features),
        'lgb': orchestrator.training_agent.train_lightgbm(X_train, y_train, X_val, y_val, features),
        'cat': orchestrator.training_agent.train_catboost(X_train, y_train, X_val, y_val, features),
    }

    logger.info("All models trained successfully")
    return models_dict, X_val, y_val, X_test, y_test


@task(name="Optimize Ensemble")
def optimize_ensemble(orchestrator, models_dict, X_val, y_val):
    """Optimize ensemble weights."""
    logger = get_run_logger()
    logger.info("Optimizing ensemble weights...")

    preds_val = orchestrator.training_agent.predict_ensemble(models_dict, X_val, list(X_val.columns))
    weights = orchestrator.training_agent.optimize_ensemble_weights(preds_val, y_val)

    logger.info(f"Optimal weights: XGB={weights[0]:.4f}, LGB={weights[1]:.4f}, CAT={weights[2]:.4f}")
    return weights


@task(name="Evaluate Models")
def evaluate_models(orchestrator, models_dict, X_test, y_test, weights):
    """Evaluate all models."""
    logger = get_run_logger()
    logger.info("Evaluating models...")

    import numpy as np

    preds_test = orchestrator.training_agent.predict_ensemble(models_dict, X_test, list(X_test.columns))

    results = {}

    # Individual models
    for model_name, preds in preds_test.items():
        mae = np.mean(np.abs(preds - y_test))
        rmse = np.sqrt(np.mean((preds - y_test) ** 2))
        results[model_name] = {'mae': float(mae), 'rmse': float(rmse)}
        logger.info(f"{model_name.upper()}: MAE={mae:.4f}, RMSE={rmse:.4f}")

    # Ensemble
    w = weights / weights.sum()
    ensemble_pred = sum(w[i] * preds_test[k] for i, k in enumerate(['xgb', 'lgb', 'cat']))
    ensemble_mae = np.mean(np.abs(ensemble_pred - y_test))
    ensemble_rmse = np.sqrt(np.mean((ensemble_pred - y_test) ** 2))

    results['ensemble'] = {
        'mae': float(ensemble_mae),
        'rmse': float(ensemble_rmse),
        'weights': {'xgb': float(w[0]), 'lgb': float(w[1]), 'cat': float(w[2])}
    }

    logger.info(f"ENSEMBLE: MAE={ensemble_mae:.4f}, RMSE={ensemble_rmse:.4f}")

    return results, y_test, ensemble_pred


@task(name="Monitor Performance")
def monitor_performance(orchestrator, y_test, ensemble_pred):
    """Run monitoring checks."""
    logger = get_run_logger()
    logger.info("Running monitoring checks...")

    # Evaluate
    orchestrator.monitoring_agent.evaluate_predictions(
        y_test.values, ensemble_pred, 'ensemble'
    )

    # Detect drift
    drift = orchestrator.monitoring_agent.detect_drift(y_test.values, ensemble_pred)
    if drift['mae_drift_detected'] or drift['std_drift_detected']:
        logger.warning(f"Drift detected: {drift}")

    # Detect outliers
    outlier = orchestrator.monitoring_agent.detect_outliers(y_test.values - ensemble_pred)
    if outlier['n_outliers'] > 0:
        logger.warning(f"Outliers detected: {outlier['n_outliers']}")

    logger.info("Monitoring complete")


@task(name="Save Artifacts")
def save_artifacts(orchestrator, models_dict, weights):
    """Save trained models and metrics."""
    logger = get_run_logger()
    logger.info("Saving artifacts...")

    orchestrator.training_agent.save_models(models_dict, weights)
    orchestrator.monitoring_agent.save_metrics()

    logger.info("Artifacts saved")


@flow(name="Energy Forecasting Training Pipeline", log_prints=True)
def training_pipeline():
    """Complete training pipeline workflow."""
    logger = get_run_logger()
    logger.info("=" * 60)
    logger.info("Starting Energy Forecasting Training Pipeline")
    logger.info("=" * 60)

    # Initialize
    orchestrator = initialize_orchestrator()

    # Data phase
    df = load_data(orchestrator)
    df = preprocess_data(orchestrator, df)
    train, val, test, features = split_data(orchestrator, df)

    # Training phase
    models_dict, X_val, y_val, X_test, y_test = train_models(
        orchestrator, train, val, test, features
    )

    # Ensemble phase
    weights = optimize_ensemble(orchestrator, models_dict, X_val, y_val)

    # Evaluation phase
    results, y_test, ensemble_pred = evaluate_models(
        orchestrator, models_dict, X_test, y_test, weights
    )

    # Monitoring phase
    monitor_performance(orchestrator, y_test, ensemble_pred)

    # Save phase
    save_artifacts(orchestrator, models_dict, weights)

    logger.info("=" * 60)
    logger.info("Pipeline Completed Successfully")
    logger.info("=" * 60)

    return results


@flow(name="Daily Inference Pipeline", log_prints=True)
def inference_pipeline():
    """Daily inference and monitoring pipeline."""
    logger = get_run_logger()
    logger.info("Starting Daily Inference Pipeline")

    orchestrator = initialize_orchestrator()

    # Run inference
    results = orchestrator.run_inference_pipeline()

    logger.info(f"Prediction: {results['prediction']:.2f} ± {results['uncertainty']:.2f}")
    logger.info(f"Top features: {results['top_features'][:3]}")

    return results


@flow(name="Forecast Generation Pipeline", log_prints=True)
def forecast_pipeline(horizon: int = 24):
    """Generate forecast pipeline."""
    logger = get_run_logger()
    logger.info(f"Starting {horizon}-step Forecast Pipeline")

    orchestrator = initialize_orchestrator()

    # Run forecast
    results = orchestrator.run_forecast_pipeline(horizon)

    logger.info(f"Generated {horizon}-step forecast")
    logger.info(f"Peak: {max(results['forecasts']):.2f}, Min: {min(results['forecasts']):.2f}")

    return results


if __name__ == "__main__":
    # Run the training pipeline
    results = training_pipeline()
    print("\nFinal Results:")
    print(results)
