import matplotlib.pyplot as plt
import numpy as np


def plot_forecast(y_true, y_pred, title='Actual vs Predicted', save_path=None):
    fig, axes = plt.subplots(2, 1, figsize=(18, 8))

    axes[0].plot(y_true.values, label='Actual', lw=1.2, color='steelblue')
    axes[0].plot(y_pred, label='Predicted', lw=1.2, color='darkorange', linestyle='--')
    axes[0].set_title(title, fontsize=13)
    axes[0].set_ylabel('MWh')
    axes[0].legend()

    errors = np.array(y_true.values) - np.array(y_pred)
    axes[1].bar(range(len(errors)), errors, color='coral', alpha=0.6)
    axes[1].axhline(0, color='black', lw=0.8)
    axes[1].set_title('Residuals', fontsize=13)
    axes[1].set_ylabel('Error (MWh)')

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.show()
