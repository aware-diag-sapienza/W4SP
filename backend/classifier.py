import numpy as np
import sklearn.ensemble
import sklearn.tree
import sklearn.neural_network
from statsmodels.stats.weightstats import ztest as ztest

import pymannkendall as mk
import ruptures as rpt

class _Classifier:
    def __init__(self, name, trainingData, trainingLabels):
        """
        trainingData is a numpy 2D array. trainingLabels is a numpy 1D array
        """
        self.name = name
        self.trainingData = trainingData
        self.trainingLabels = trainingLabels
        self.model = None

        self.data = trainingData
        self.labels = trainingLabels

    def predict(self, X):
        return self.model.predict(X)

    '''
    def old_predictClassProbability(self, X, className):
        prediction = self.model.predict(X)
        uniqueValues, occurCount = np.unique(prediction, return_counts=True)
        if len(uniqueValues) == 1 and uniqueValues[0] != className:
            return 0.0
        else: 
            return occurCount[np.where(uniqueValues == className)[0][0]] / len(X)
    '''

    def __getDistribution(self, values):
        _round = 4
        
        mean = np.around( np.mean(values), _round)
        var = np.around( np.var(values), _round)
        mi = np.min(values)
        mi_w = None
        q1 = np.around( np.quantile(values, 0.25), _round)
        q2 = np.around( np.median(values), _round)
        q3 = np.around( np.quantile(values, 0.75), _round)
        ma_w = None
        ma = np.max(values) 
        
        iqr = q3 - q1
        mi_w = round( max(q1 - (1.5 * iqr), mi), _round)
        ma_w = round( min(q3 + (1.5 * iqr), ma), _round)

        ci99 = 2.58 * np.sqrt(var) / np.sqrt(len(values))
        ci95 = 1.96 * np.sqrt(var) / np.sqrt(len(values))
        
        return np.array([
            mi,
            mi_w,
            q1,
            q2,
            q3,
            ma_w,
            ma,
            mean,
            var,
            ci99,
            ci95
        ])
    
    def zTest(self, tuplesIdx):
        result = []
        tuples = self.data[tuplesIdx]
        for i in range(self.data.shape[1]):
            arr1 = tuples[:,i]
            arr2 = self.data[:,i]
            f, p = ztest(arr1, arr2, value=0)
            result.append({
                'accepted': p <= 0.05,
                'meanDiffPercent': round( np.abs(arr1.mean() - arr2.mean()) / np.mean(arr2), 4),
                'meanDiffAbs': np.abs(arr1.mean() - arr2.mean()),
                'meanDiff': arr1.mean() - arr2.mean(),
                'f': f,
                'p': p,
            })
        return result

    def predictClass(self, X, className):
        prediction = self.model.predict(X)
        idxGood = np.where(prediction == className) # where result == className
        idxBad = np.where(prediction != className) # where != className
        # 1 if label is equal to className, 0 otherwise
        numericPrediction = np.full_like(prediction, np.nan, float)
        numericPrediction[idxGood] = 1.0
        numericPrediction[idxBad] = 0.0
        return numericPrediction

    def predictClassProbability(self, X, className):
        numericPrediction = self.predictClass(X, className)
        return np.mean(numericPrediction)


    def getSinglePartialDependence(self, className, feature, targetValues):
        n = len(targetValues)
        pdp = np.full(n, np.nan, float) #partialDependence plot
        ice = np.full((self.data.shape[0], n), np.nan, float) # iceplot
        density = np.full(n, 0, dtype=int) #number of original tuples in each interval
        
        X = self.data.copy()
        for i, v in enumerate(targetValues):
            X[:,feature] = v
            pdp[i] = self.predictClassProbability(X, className)
            ice[:,i] = self.predictClass(X, className)
        
        iceClusters = self._createIceClusters(ice, pdp)

        return np.around(pdp, 3), ice, iceClusters
    
    def getDoublePartialDependence(self, className, fx, fy, targetValuesX, targetValuesY):
        nRows = len(targetValuesY) # y
        nColumns = len(targetValuesX) # x
        n = nRows * nColumns
        
        ice = np.full((self.data.shape[0], n), np.nan, float)
        pdp = np.full(n, np.nan, dtype=float)
        '''
        const getCol = (i) => parseInt(Math.floor(i / nRows))
        const getRow = (i) => i % nCols
        '''
        def getI(r, c):
            return (r * nColumns) + c

        X = self.data.copy()
        for r, vy in enumerate(targetValuesY):
            for c, vx in enumerate(targetValuesX):
                i = getI(r, c)
                X[:, [fx, fy]] = [vx, vy]
                ice[:, i] = self.predictClass(X, className)
                pdp[i] = round(self.predictClassProbability(X, className), 3)
        
        return pdp, ice


    def _createIceClusters(self, ice, pdp):
        clusters = []
        assigned = np.zeros(np.shape(ice)[0], dtype=int)
        # return the indices of rows with exactly one positive or one negative flip
        def get_pn(nda_flips):
            p = np.count_nonzero(nda_flips == 1, axis=1)
            p_ones = np.where(p==1)
            p_nonz = np.where(p>0)
            n = np.count_nonzero(nda_flips == -1, axis=1)
            n_ones = np.where(n==1)
            n_nonz = np.where(n>0)
            return np.setdiff1d(p_ones, n_nonz), np.setdiff1d(n_ones, p_nonz)
        def add_cluster(tuples, data):
            if len(tuples) > 0:
                entries = ice[tuples,:]
                pd = np.mean(entries, axis=0)
                data['mk'] = mk.original_test(pd)._asdict()
                data['ts'] = mk.sens_slope(pd)._asdict()
                cp_alg = rpt.Pelt(model='rbf', min_size=1, jump=1).fit(pd)
                data['cp'] = cp_alg.predict(pen=0.8)
                data['zscore'] = self.zTest(tuples)
                cl = {
                    "tuples": tuples,
                    "pd": pd,
                    "data": data
                }
                clusters.append(cl)
                assigned[tuples] = 1
        # domain true
        cdt_tuples = np.where(ice.all(axis=1))[0]
        cdt_data = {
            "type": "pos"
        }
        add_cluster(cdt_tuples, cdt_data)
        # domain false
        cdf_tuples = np.where(~ice.any(axis=1))[0]
        cdf_data = {
            "type": "neg"
        }
        add_cluster(cdf_tuples, cdf_data)
        # domain positive / negative
        flips = np.diff(ice)
        cdp_tuples, cdn_tuples = get_pn(flips)
        cdp_data = {
            "type": "pos_flip"
        }
        add_cluster(cdp_tuples, cdp_data)
        cdn_data = {
            "type": "neg_flip"
        }
        add_cluster(cdn_tuples, cdn_data)
        # domain others
        cdx_tuples = np.nonzero(assigned==0)[0]
        cdx_data = {
            "type": "mix"
        }
        add_cluster(cdx_tuples, cdx_data)
        clusters.sort(key=lambda x: len(x['tuples']), reverse=True)
        return clusters

    ## used for evaluation, returns 1D numpy array
    def computePartialDependenceArray_1D(self, className, feature, targetValues):
        pdp = np.full(len(targetValues), np.nan, float)
        X = self.data.copy()
        for i, v in enumerate(targetValues):
            X[:,feature] = v
            pdp[i] = self.predictClassProbability(X, className)
        return np.around(pdp, 3)

    def computePartialDependenceArray_2D(self, className, f1, f2, targetValues1, targetValues2):
        pdp = np.full((len(targetValues1), len(targetValues2)), np.nan, dtype=float)
        X = self.data.copy()
        for i, v1 in enumerate(targetValues1):
            for j, v2 in enumerate(targetValues2):
                X[:, [f1, f2]] = [v1, v2]
                pdp[i,j] = round(self.predictClassProbability(X, className), 3)
        return pdp

    def computePartialDependenceArray_3D(self, className, f1, f2, f3, targetValues1, targetValues2, targetValues3):
        pdp = np.full((len(targetValues1), len(targetValues2), len(targetValues3)), np.nan, dtype=float)
        X = self.data.copy()
        for i, v1 in enumerate(targetValues1):
            for j, v2 in enumerate(targetValues2):
                for z, v3 in enumerate(targetValues3):
                    X[:, [f1, f2, f3]] = [v1, v2, v3]
                    pdp[i,j,z] = round(self.predictClassProbability(X, className), 3)
        return pdp
    
    def computePartialDependenceArray_4D(self, className, f1, f2, f3, f4, targetValues1, targetValues2, targetValues3, targetValues4):
        pdp = np.full((len(targetValues1), len(targetValues2), len(targetValues3), len(targetValues4)), np.nan, dtype=float)
        X = self.data.copy()
        for i, v1 in enumerate(targetValues1):
            for j, v2 in enumerate(targetValues2):
                for k, v3 in enumerate(targetValues3):
                    for z, v4 in enumerate(targetValues3):
                        X[:, [f1, f2, f3, f4]] = [v1, v2, v3, v4]
                        pdp[i,j,k,z] = round(self.predictClassProbability(X, className), 3)
        return pdp
#
#
#
#
class DecisionTreeClassifier(_Classifier):
    def __init__(self, trainingData, trainingLabels, random_state=0):
        super().__init__("DecisionTree", trainingData, trainingLabels)
        self.model = sklearn.tree.DecisionTreeClassifier(criterion="entropy", random_state=random_state)
        self.model.fit(trainingData, trainingLabels)
#
#
#
class RandomForestClassifier(_Classifier):
    def __init__(self, trainingData, trainingLabels, random_state=0, n_estimators=10):
        super().__init__("RandomForest", trainingData, trainingLabels)
        self.model = sklearn.ensemble.RandomForestClassifier(criterion="entropy", random_state=random_state, n_estimators=n_estimators, n_jobs=-1)
        self.model.fit(trainingData, trainingLabels)
#
#
#
class NeuralNetworkClassifier(_Classifier):
    def __init__(self, trainingData, trainingLabels, random_state=0, max_iter=1000):
        super().__init__("NeuralNetwork", trainingData, trainingLabels)
        self.model = sklearn.neural_network.MLPClassifier(random_state=random_state, max_iter=max_iter)
        self.model.fit(trainingData, trainingLabels)
#
#
#