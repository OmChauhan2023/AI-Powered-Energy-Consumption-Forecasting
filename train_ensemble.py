import sys
sys.path.append('src')

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostRegressor
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error

print("="*60)
print("  STEP 1: Advanced Feature Engineering")
print("="*60)

df_raw = pd.read_csv('data/energy_clean.csv', index_col='timestamp', parse_dates=True)

def build_features(df):
    d = df.copy()

    # Time features
    d['hour']        = d.index.hour
    d['day_of_week'] = d.index.dayofweek
    d['day_of_year'] = d.index.dayofyear
    d['week']        = d.index.isocalendar().week.astype(int)
    d['month']       = d.index.month
    d['year']        = d.index.year
    d['quarter']     = d.index.quarter

    # Cyclic encoding
    d['hour_sin']  = np.sin(2 * np.pi * d['hour'] / 24)
    d['hour_cos']  = np.cos(2 * np.pi * d['hour'] / 24)
    d['month_sin'] = np.sin(2 * np.pi * d['month'] / 12)
    d['month_cos'] = np.cos(2 * np.pi * d['month'] / 12)
    d['dow_sin']   = np.sin(2 * np.pi * d['day_of_week'] / 7)
    d['dow_cos']   = np.cos(2 * np.pi * d['day_of_week'] / 7)
    d['doy_sin']   = np.sin(2 * np.pi * d['day_of_year'] / 365)
    d['doy_cos']   = np.cos(2 * np.pi * d['day_of_year'] / 365)

    # Weekend / Weekday
    d['is_weekend'] = (d['day_of_week'] >= 5).astype(int)
    d['is_weekday'] = (d['day_of_week'] < 5).astype(int)

    # ── Australian seasons (Southern Hemisphere)
    # Summer: Dec-Feb | Autumn: Mar-May | Winter: Jun-Aug | Spring: Sep-Nov
    def get_au_season(month):
        if month in [12, 1, 2]:  return 0   # Summer
        if month in [3, 4, 5]:   return 1   # Autumn
        if month in [6, 7, 8]:   return 2   # Winter
        return 3                            # Spring
    d['au_season']    = d['month'].map(get_au_season)
    d['is_au_summer'] = (d['au_season'] == 0).astype(int)
    d['is_au_autumn'] = (d['au_season'] == 1).astype(int)
    d['is_au_winter'] = (d['au_season'] == 2).astype(int)
    d['is_au_spring'] = (d['au_season'] == 3).astype(int)

    # ── Time-of-day segments
    d['is_morning']   = ((d['hour'] >= 6)  & (d['hour'] < 12)).astype(int)
    d['is_afternoon'] = ((d['hour'] >= 12) & (d['hour'] < 17)).astype(int)
    d['is_evening']   = ((d['hour'] >= 17) & (d['hour'] < 22)).astype(int)
    d['is_night']     = ((d['hour'] >= 22) | (d['hour'] < 6)).astype(int)

    # Business / peak hours
    d['is_business_hour'] = ((d['hour'] >= 8) & (d['hour'] <= 18) & (d['is_weekday'] == 1)).astype(int)
    d['is_peak_morning']  = ((d['hour'] >= 7) & (d['hour'] <= 10)).astype(int)
    d['is_peak_evening']  = ((d['hour'] >= 17) & (d['hour'] <= 20)).astype(int)

    # ── Australian public + festival holidays
    try:
        import holidays as hol_lib
        au_hols = hol_lib.country_holidays('AU', subdiv='VIC',
                                           years=list(range(int(d.index.year.min()), int(d.index.year.max()) + 2)))
        holiday_dates = set(au_hols.keys())
        d['is_holiday'] = d.index.normalize().map(lambda dt: int(dt.date() in holiday_dates))
    except Exception:
        d['is_holiday'] = 0

    # ── Anomaly flag (IQR method) — does NOT drop rows
    Q1, Q3 = d['consumption_mwh'].quantile(0.25), d['consumption_mwh'].quantile(0.75)
    IQR = Q3 - Q1
    d['is_anomaly'] = (((d['consumption_mwh'] < Q1 - 2.5 * IQR) |
                        (d['consumption_mwh'] > Q3 + 2.5 * IQR))).astype(int)
    mu, sigma = d['consumption_mwh'].mean(), d['consumption_mwh'].std()
    d['anomaly_z_score'] = ((d['consumption_mwh'] - mu) / (sigma + 1e-8)).round(4)
    print(f"  Anomaly detection: {d['is_anomaly'].sum()} flagged rows ({d['is_anomaly'].mean()*100:.2f}%)")

    # COVID-19 period flag
    covid_start = pd.Timestamp('2020-03-01')
    covid_end   = pd.Timestamp('2021-06-30')
    d['is_covid'] = ((d.index >= covid_start) & (d.index <= covid_end)).astype(int)

    # Baseline avg from 2016-2019 per hour+dow
    baseline     = d[d['year'].isin([2016, 2017, 2018, 2019])].copy()
    baseline_avg = baseline.groupby(['hour', 'day_of_week'])['consumption_mwh'].mean().rename('baseline_avg')
    d = d.join(baseline_avg, on=['hour', 'day_of_week'])
    d['covid_deviation'] = (d['consumption_mwh'] - d['baseline_avg']).fillna(0)

    # Lag features
    for lag in [1, 2, 3, 6, 12, 24, 48, 72, 168, 336]:
        d[f'lag_{lag}h'] = d['consumption_mwh'].shift(lag)

    # Rolling statistics
    for window in [6, 12, 24, 48, 168]:
        shifted = d['consumption_mwh'].shift(1)
        d[f'roll_mean_{window}h'] = shifted.rolling(window).mean()
        d[f'roll_std_{window}h']  = shifted.rolling(window).std()
        d[f'roll_min_{window}h']  = shifted.rolling(window).min()
        d[f'roll_max_{window}h']  = shifted.rolling(window).max()

    # Exponential weighted mean
    d['ewm_24h']  = d['consumption_mwh'].shift(1).ewm(span=24).mean()
    d['ewm_168h'] = d['consumption_mwh'].shift(1).ewm(span=168).mean()

    # Interaction features
    d['hour_x_weekend']     = d['hour'] * d['is_weekend']
    d['hour_x_au_season']   = d['hour'] * d['au_season']
    d['covid_x_weekend']    = d['is_covid'] * d['is_weekend']
    d['covid_x_au_season']  = d['is_covid'] * d['au_season']
    d['holiday_x_weekend']  = d['is_holiday'] * d['is_weekend']
    d['morning_x_weekend']  = d['is_morning'] * d['is_weekend']
    d['evening_x_weekend']  = d['is_evening'] * d['is_weekend']

    # YoY same-hour reference (364 days back)
    d['lag_8736h'] = d['consumption_mwh'].shift(8736)

    d = d.dropna()
    return d

df = build_features(df_raw)
print(f"Dataset shape: {df.shape}")
print(f"Date range: {df.index.min()} to {df.index.max()}")

TARGET    = 'consumption_mwh'
DROP_COLS = ['baseline_avg', 'au_season', 'anomaly_z_score']
FEATURES  = [c for c in df.columns if c != TARGET and c not in DROP_COLS]
print(f"Total features: {len(FEATURES)}")
print(f"  Anomaly rows in dataset: {df['is_anomaly'].sum()} / {len(df)}")

# ─────────────────────────────────────────────
# COVID ANALYSIS
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("  STEP 2: COVID-19 Impact Analysis")
print("="*60)

pre_covid  = df[df['year'].isin([2016, 2017, 2018, 2019])]['consumption_mwh']
covid_mask = (df.index >= '2020-03-01') & (df.index <= '2021-06-30')
covid_data = df[covid_mask]['consumption_mwh']
post_covid = df[df.index > '2021-06-30']['consumption_mwh']

print(f"Pre-COVID avg  (2016-2019):   {pre_covid.mean():,.2f} MWh")
print(f"COVID avg      (Mar20-Jun21): {covid_data.mean():,.2f} MWh")
print(f"Post-COVID avg (Jul21+):      {post_covid.mean():,.2f} MWh")
print(f"COVID drop vs baseline:       {((pre_covid.mean()-covid_data.mean())/pre_covid.mean()*100):+.2f}%")

print("\nWeekday vs Weekend:")
weekday = df[df['is_weekday'] == 1]['consumption_mwh']
weekend = df[df['is_weekend'] == 1]['consumption_mwh']
print(f"  Weekday avg: {weekday.mean():,.2f} MWh")
print(f"  Weekend avg: {weekend.mean():,.2f} MWh")
print(f"  Weekday premium: {((weekday.mean()-weekend.mean())/weekend.mean()*100):+.2f}%")

print("\nAustralian Seasonal Averages:")
for name, col in [('Summer (Dec-Feb)', 'is_au_summer'), ('Autumn (Mar-May)', 'is_au_autumn'),
                  ('Winter (Jun-Aug)', 'is_au_winter'), ('Spring (Sep-Nov)', 'is_au_spring')]:
    print(f"  {name}: {df[df[col]==1]['consumption_mwh'].mean():,.2f} MWh")

if 'is_holiday' in df.columns:
    print(f"\nHoliday avg:    {df[df['is_holiday']==1]['consumption_mwh'].mean():,.2f} MWh")
    print(f"Non-holiday avg:{df[df['is_holiday']==0]['consumption_mwh'].mean():,.2f} MWh")
print(f"Morning avg:    {df[df['is_morning']==1]['consumption_mwh'].mean():,.2f} MWh")
print(f"Evening avg:    {df[df['is_evening']==1]['consumption_mwh'].mean():,.2f} MWh")

# COVID plot
fig, axes = plt.subplots(2, 1, figsize=(18, 10))
monthly = df_raw.resample('ME').mean()
axes[0].plot(monthly.index, monthly['consumption_mwh'], color='steelblue', lw=1.5)
axes[0].axvspan(pd.Timestamp('2020-03-01'), pd.Timestamp('2021-06-30'),
                alpha=0.2, color='red', label='COVID Period')
axes[0].axhline(pre_covid.mean(), color='green', linestyle='--', lw=1.2,
                label=f'Pre-COVID avg ({pre_covid.mean():,.0f} MWh)')
axes[0].axhline(covid_data.mean(), color='red', linestyle='--', lw=1.2,
                label=f'COVID avg ({covid_data.mean():,.0f} MWh)')
axes[0].set_title('Monthly Energy Consumption with COVID-19 Impact', fontsize=13)
axes[0].set_ylabel('MWh')
axes[0].legend()

wk_avgs = df.groupby(['au_season', 'is_weekend'])['consumption_mwh'].mean().unstack()
wk_avgs.index = ['AU Summer', 'AU Autumn', 'AU Winter', 'AU Spring']
wk_avgs.columns = ['Weekday', 'Weekend']
wk_avgs.plot(kind='bar', ax=axes[1], color=['steelblue', 'coral'], edgecolor='white', width=0.6)
axes[1].set_title('Avg Consumption by AU Season & Day Type', fontsize=13)
axes[1].set_ylabel('MWh')
axes[1].set_xticklabels(axes[1].get_xticklabels(), rotation=15)
axes[1].legend()
plt.tight_layout()
plt.savefig('outputs/figures/ensemble/covid_analysis.png', dpi=150, bbox_inches='tight')
print("\nCOVID analysis plot saved.")

# ─────────────────────────────────────────────
# TRAIN / VAL / TEST SPLIT  70/15/15
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("  STEP 3: Train/Val/Test Split (70/15/15)")
print("="*60)

n         = len(df)
train_end = int(n * 0.70)
val_end   = int(n * 0.85)

train = df.iloc[:train_end]
val   = df.iloc[train_end:val_end]
test  = df.iloc[val_end:]

print(f"Train: {len(train):,}  ({train.index.min().date()} to {train.index.max().date()})")
print(f"Val:   {len(val):,}  ({val.index.min().date()} to {val.index.max().date()})")
print(f"Test:  {len(test):,}  ({test.index.min().date()} to {test.index.max().date()})")

# ─────────────────────────────────────────────
# TRAIN BASE MODELS (ALL FEATURES)
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("  STEP 4: Train Base Models (All Features)")
print("="*60)

print("\n[XGBoost]")
xgb_m = xgb.XGBRegressor(
    n_estimators=1500, learning_rate=0.03, max_depth=7,
    subsample=0.8, colsample_bytree=0.8, min_child_weight=3, gamma=0.1,
    early_stopping_rounds=50, random_state=42, tree_method='hist', verbosity=0
)
xgb_m.fit(train[FEATURES], train[TARGET],
          eval_set=[(val[FEATURES], val[TARGET])], verbose=200)

print("\n[LightGBM]")
lgb_m = lgb.LGBMRegressor(
    n_estimators=1500, learning_rate=0.03, max_depth=7,
    subsample=0.8, colsample_bytree=0.8, min_child_samples=20,
    reg_alpha=0.1, reg_lambda=0.1, random_state=42, verbose=-1
)
lgb_m.fit(train[FEATURES], train[TARGET],
          eval_set=[(val[FEATURES], val[TARGET])],
          callbacks=[lgb.early_stopping(50), lgb.log_evaluation(200)])

print("\n[CatBoost]")
cat_m = CatBoostRegressor(
    iterations=1500, learning_rate=0.03, depth=7,
    loss_function='RMSE', eval_metric='MAE',
    early_stopping_rounds=50, random_seed=42, verbose=200
)
cat_m.fit(train[FEATURES], train[TARGET],
          eval_set=(val[FEATURES], val[TARGET]), use_best_model=True)

# ─────────────────────────────────────────────
# FEATURE SELECTION — SHAP + COMBINED IMPORTANCE
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("  STEP 5: Feature Selection via SHAP + Combined Importance")
print("="*60)

# Built-in importance (normalised)
xgb_fi = pd.Series(xgb_m.feature_importances_, index=FEATURES)
lgb_fi = pd.Series(lgb_m.feature_importances_, index=FEATURES)
cat_fi = pd.Series(cat_m.get_feature_importance(), index=FEATURES)
combined_fi = (xgb_fi/xgb_fi.sum() + lgb_fi/lgb_fi.sum() + cat_fi/cat_fi.sum()) / 3

# SHAP values (use LightGBM — fastest)
try:
    import shap
    sample_X = train[FEATURES].iloc[:4000]
    explainer   = shap.TreeExplainer(lgb_m)
    shap_values = explainer.shap_values(sample_X)
    shap_imp    = pd.Series(np.abs(shap_values).mean(axis=0), index=FEATURES)
    shap_imp    = shap_imp / shap_imp.sum()
    # Blend: 50% SHAP + 50% combined built-in
    final_imp = (0.5 * shap_imp + 0.5 * combined_fi).sort_values(ascending=False)
    print("  SHAP-blended importance computed.")
except Exception as e:
    print(f"  SHAP unavailable ({e}); using built-in importance only.")
    final_imp = combined_fi.sort_values(ascending=False)

TOP_N        = 30
TOP_FEATURES = final_imp.head(TOP_N).index.tolist()
print(f"\nTop {TOP_N} features selected:")
for i, f in enumerate(TOP_FEATURES, 1):
    print(f"  {i:2d}. {f}  ({final_imp[f]:.4f})")

plt.figure(figsize=(12, 10))
final_imp.head(TOP_N).sort_values().plot(kind='barh', color='steelblue', edgecolor='white')
plt.title(f'Ensemble — Top {TOP_N} SHAP + Feature Importance (Blended)', fontsize=13)
plt.xlabel('Blended Normalised Importance')
plt.tight_layout()
plt.savefig('outputs/figures/ensemble/feature_importance.png', dpi=150, bbox_inches='tight')

# ─────────────────────────────────────────────
# RETRAIN ON TOP FEATURES
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("  STEP 6: Retrain on Top Features")
print("="*60)

xgb_m2 = xgb.XGBRegressor(
    n_estimators=1500, learning_rate=0.03, max_depth=7,
    subsample=0.8, colsample_bytree=0.8, min_child_weight=3, gamma=0.1,
    early_stopping_rounds=50, random_state=42, tree_method='hist', verbosity=0
)
xgb_m2.fit(train[TOP_FEATURES], train[TARGET],
           eval_set=[(val[TOP_FEATURES], val[TARGET])], verbose=False)
print("XGBoost done.")

lgb_m2 = lgb.LGBMRegressor(
    n_estimators=1500, learning_rate=0.03, max_depth=7,
    subsample=0.8, colsample_bytree=0.8, min_child_samples=20,
    reg_alpha=0.1, reg_lambda=0.1, random_state=42, verbose=-1
)
lgb_m2.fit(train[TOP_FEATURES], train[TARGET],
           eval_set=[(val[TOP_FEATURES], val[TARGET])],
           callbacks=[lgb.early_stopping(50), lgb.log_evaluation(False)])
print("LightGBM done.")

cat_m2 = CatBoostRegressor(
    iterations=1500, learning_rate=0.03, depth=7,
    loss_function='RMSE', eval_metric='MAE',
    early_stopping_rounds=50, random_seed=42, verbose=False
)
cat_m2.fit(train[TOP_FEATURES], train[TARGET],
           eval_set=(val[TOP_FEATURES], val[TARGET]), use_best_model=True)
print("CatBoost done.")

# ─────────────────────────────────────────────
# OPTIMISE ENSEMBLE WEIGHTS ON VAL SET
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("  STEP 7: Optimise Ensemble Weights")
print("="*60)

val_xgb  = xgb_m2.predict(val[TOP_FEATURES])
val_lgb  = lgb_m2.predict(val[TOP_FEATURES])
val_cat  = cat_m2.predict(val[TOP_FEATURES])
val_true = val[TARGET].values

best_mae, best_w = np.inf, (0.33, 0.34, 0.33)
for w1 in np.arange(0.1, 0.71, 0.05):
    for w2 in np.arange(0.1, 0.71, 0.05):
        w3 = round(1 - w1 - w2, 2)
        if w3 < 0.05:
            continue
        preds = w1*val_xgb + w2*val_lgb + w3*val_cat
        mae = mean_absolute_error(val_true, preds)
        if mae < best_mae:
            best_mae = mae
            best_w   = (round(w1, 2), round(w2, 2), w3)

w_xgb, w_lgb, w_cat = best_w
print(f"Best weights -> XGB: {w_xgb}  LGB: {w_lgb}  CAT: {w_cat}")
print(f"Val MAE: {best_mae:,.4f}")

# ─────────────────────────────────────────────
# TEST SET EVALUATION
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("  STEP 8: Test Set Evaluation")
print("="*60)

test_xgb  = xgb_m2.predict(test[TOP_FEATURES])
test_lgb  = lgb_m2.predict(test[TOP_FEATURES])
test_cat  = cat_m2.predict(test[TOP_FEATURES])
test_true = test[TARGET].values
ens_preds = w_xgb*test_xgb + w_lgb*test_lgb + w_cat*test_cat

def full_report(y_true, y_pred, name):
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mask = y_true != 0
    mape  = np.mean(np.abs((y_true[mask]-y_pred[mask])/y_true[mask]))*100
    denom = (np.abs(y_true)+np.abs(y_pred))/2
    smape = np.mean(np.abs(y_true-y_pred)/denom)*100
    print(f"\n{'='*50}")
    print(f"  {name} - Performance Metrics")
    print(f"{'='*50}")
    print(f"  MAE  (Mean Absolute Error):    {mae:,.4f}")
    print(f"  RMSE (Root Mean Squared Error): {rmse:,.4f}")
    print(f"  MAPE (Mean Absolute % Error):  {mape:.4f}%")
    print(f"{'='*50}")
    return {'model': name, 'MAE': mae, 'RMSE': rmse, 'MAPE': mape, 'SMAPE': smape}

results = []
results.append(full_report(test_true, test_xgb,  'XGBoost'))
results.append(full_report(test_true, test_lgb,  'LightGBM'))
results.append(full_report(test_true, test_cat,  'CatBoost'))
results.append(full_report(test_true, ens_preds, f'Weighted Ensemble ({w_xgb}/{w_lgb}/{w_cat})'))

metrics_df = pd.DataFrame(results).set_index('model')
metrics_df.to_csv('outputs/metrics/ensemble_results.csv')
print("\nMetrics saved.")

# ─────────────────────────────────────────────
# PLOTS
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("  STEP 9: Generating Plots")
print("="*60)

n_plot = 168

# Forecast + residuals
fig, axes = plt.subplots(2, 1, figsize=(18, 10))
axes[0].plot(test_true[:n_plot], label='Actual', color='steelblue', lw=1.5)
axes[0].plot(ens_preds[:n_plot], label=f'Ensemble ({w_xgb}/{w_lgb}/{w_cat})', color='darkorange', lw=1.5, linestyle='--')
axes[0].plot(test_lgb[:n_plot], label='LightGBM', color='seagreen', lw=1, alpha=0.7, linestyle=':')
axes[0].set_title('Weighted Ensemble — First 7 Days of Test Set', fontsize=13)
axes[0].set_ylabel('MWh')
axes[0].legend()
errors = test_true - ens_preds
axes[1].bar(range(len(errors)), errors, color='coral', alpha=0.5)
axes[1].axhline(0, color='black', lw=0.8)
axes[1].set_title('Ensemble Residuals', fontsize=13)
axes[1].set_ylabel('Error (MWh)')
plt.tight_layout()
plt.savefig('outputs/figures/ensemble/forecast.png', dpi=150, bbox_inches='tight')

# Model comparison bar chart
fig, ax = plt.subplots(figsize=(10, 5))
model_names = ['XGBoost', 'LightGBM', 'CatBoost', 'Ensemble']
maes   = [r['MAE'] for r in results]
mapes  = [r['MAPE'] for r in results]
colors = ['#4C72B0', '#55A868', '#C44E52', '#DD8452']
bars = ax.bar(model_names, maes, color=colors, edgecolor='white', width=0.5)
for bar, val in zip(bars, maes):
    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.3,
            f'{val:,.1f}', ha='center', va='bottom', fontsize=10)
ax.set_title('Model Comparison — MAE on Test Set', fontsize=13)
ax.set_ylabel('MAE (MWh)')
plt.tight_layout()
plt.savefig('outputs/figures/ensemble/model_comparison_mae.png', dpi=150, bbox_inches='tight')

# MAPE comparison
fig, ax = plt.subplots(figsize=(10, 5))
bars = ax.bar(model_names, mapes, color=colors, edgecolor='white', width=0.5)
for bar, val in zip(bars, mapes):
    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.005,
            f'{val:.3f}%', ha='center', va='bottom', fontsize=10)
ax.set_title('Model Comparison — MAPE on Test Set', fontsize=13)
ax.set_ylabel('MAPE (%)')
plt.tight_layout()
plt.savefig('outputs/figures/ensemble/model_comparison_mape.png', dpi=150, bbox_inches='tight')

# COVID deviation over time
covid_dev = df[df['is_covid']==1]['covid_deviation'].resample('W').mean()
pre_dev   = df[df['year'].isin([2016,2017,2018,2019])]['covid_deviation'].resample('W').mean()
fig, ax = plt.subplots(figsize=(16, 5))
ax.plot(pre_dev.index, pre_dev.values, color='steelblue', lw=1, alpha=0.5, label='Pre-COVID deviation')
ax.plot(covid_dev.index, covid_dev.values, color='crimson', lw=1.5, label='COVID period deviation')
ax.axhline(0, color='black', lw=0.8)
ax.fill_between(covid_dev.index, covid_dev.values, 0,
                where=(covid_dev.values < 0), color='crimson', alpha=0.2, label='Drop below baseline')
ax.set_title('COVID-19 Impact: Weekly Deviation from Historical Baseline', fontsize=13)
ax.set_ylabel('MWh deviation')
ax.legend()
plt.tight_layout()
plt.savefig('outputs/figures/ensemble/covid_deviation.png', dpi=150, bbox_inches='tight')

# Seasonal + weekday heatmaps (Australian seasons)
pivot1 = df.groupby(['hour', 'au_season'])['consumption_mwh'].mean().unstack()
pivot1.columns = ['AU Summer', 'AU Autumn', 'AU Winter', 'AU Spring']
pivot2 = df.groupby(['hour', 'is_weekend'])['consumption_mwh'].mean().unstack()
pivot2.columns = ['Weekday', 'Weekend']
fig, axes = plt.subplots(1, 2, figsize=(16, 7))
sns.heatmap(pivot1, ax=axes[0], cmap='YlOrRd', linewidths=0.3, annot=False)
axes[0].set_title('Avg Consumption: Hour x AU Season', fontsize=12)
axes[0].set_xlabel('AU Season')
axes[0].set_ylabel('Hour of Day')
sns.heatmap(pivot2, ax=axes[1], cmap='YlGnBu', linewidths=0.3, annot=False)
axes[1].set_title('Avg Consumption: Hour x Day Type', fontsize=12)
axes[1].set_xlabel('Day Type')
axes[1].set_ylabel('Hour of Day')
plt.tight_layout()
plt.savefig('outputs/figures/ensemble/seasonal_heatmaps.png', dpi=150, bbox_inches='tight')

# Anomaly distribution plot
fig, ax = plt.subplots(figsize=(12, 4))
normal = df[df['is_anomaly'] == 0]['consumption_mwh']
anomalies = df[df['is_anomaly'] == 1]['consumption_mwh']
ax.hist(normal, bins=80, color='steelblue', alpha=0.6, label='Normal')
ax.hist(anomalies, bins=30, color='crimson', alpha=0.8, label=f'Anomalies ({len(anomalies):,})')
ax.set_title('Anomaly Detection — Consumption Distribution (IQR Method)', fontsize=13)
ax.set_xlabel('Consumption (MWh)')
ax.set_ylabel('Count')
ax.legend()
plt.tight_layout()
plt.savefig('outputs/figures/ensemble/anomaly_distribution.png', dpi=150, bbox_inches='tight')

print("All plots saved to outputs/figures/ensemble/")

# Save models and metadata
joblib.dump(xgb_m2, 'models/ensemble_xgb.pkl')
joblib.dump(lgb_m2, 'models/ensemble_lgb.pkl')
joblib.dump(cat_m2, 'models/ensemble_cat.pkl')
joblib.dump({'weights': best_w, 'top_features': TOP_FEATURES}, 'models/ensemble_meta.pkl')
print("All models saved to models/")

print("\n" + "="*60)
print("  DONE!")
print("="*60)
