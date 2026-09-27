"""Custom transformer used by the Iris species pipeline.

Lives in its own module so joblib can find `FlowerShapeFeatures` by import
path when the bundle is loaded in serve.py (locally and on Modal).
"""

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.utils.validation import check_array, check_is_fitted

INPUT_FEATURES = ["sepal_length", "sepal_width", "petal_length", "petal_width"]
SHAPE_FEATURES = ["sepal_ratio", "petal_ratio", "log_petal_area", "petal_to_sepal_length"]


class FlowerShapeFeatures(BaseEstimator, TransformerMixin):
    """Append shape features (length/width ratios, log petal area) to the
    four raw Iris measurements.

    Learned state: `n_features_in_` and `floor_`, the per-column minimum seen
    during fit (scaled by `floor_fraction`). Widths and lengths below that
    floor are clipped before dividing, so a near-zero width at predict time
    can't blow up a ratio.
    """

    def __init__(self, floor_fraction=0.5):
        self.floor_fraction = floor_fraction

    def fit(self, X, y=None):
        X = check_array(X, dtype=float)
        if X.shape[1] != len(INPUT_FEATURES):
            raise ValueError(f"expected {len(INPUT_FEATURES)} columns, got {X.shape[1]}")
        self.n_features_in_ = X.shape[1]
        self.floor_ = X.min(axis=0) * self.floor_fraction
        return self

    def transform(self, X):
        check_is_fitted(self, "floor_")
        X = check_array(X, dtype=float)
        safe = np.maximum(X, self.floor_)
        sepal_len, sepal_wid, petal_len, petal_wid = safe.T
        shape = np.column_stack([
            sepal_len / sepal_wid,
            petal_len / petal_wid,
            np.log(petal_len * petal_wid),
            petal_len / sepal_len,
        ])
        return np.hstack([X, shape])

    def get_feature_names_out(self, input_features=None):
        return np.array(INPUT_FEATURES + SHAPE_FEATURES, dtype=object)
