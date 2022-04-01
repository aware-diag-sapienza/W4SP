import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

import numpy as np
import pandas as pd
from sklearn.utils import Bunch
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE, Isomap, MDS
import itertools

#
_round = 4
#
class Dataset:
    def __init__(self, name, dataframe, classColumn, targetLabel, uniformGridBins=20, distributionsBasedBins=10, createProjection=True):
        self.name = name
        self.dataframe = dataframe
        self.classColumn = classColumn
        self.targetLabel = targetLabel

        self.data = self.dataframe.drop(classColumn, axis=1).to_numpy()
        self.scaledData = StandardScaler().fit_transform(self.data)
        self.labels = self.dataframe.loc[:,self.classColumn].to_numpy()

        # create features data
        self.features = []
        for i, fname in enumerate(list(self.dataframe.drop(classColumn, axis=1).columns)):
            values = self.data[:,i]
            scaledValues = self.scaledData[:,i]
            isInteger = np.all(np.equal(np.mod(values, 1), 0))
            
            f = Bunch(
                id = i,
                name = fname,
                isInteger = isInteger,
                distribution = Bunch(
                    min = np.min(values),
                    min_w = None,
                    q1 = np.around( np.quantile(values, 0.25), _round),
                    q2 = np.around( np.median(values), _round),
                    q3 = np.around( np.quantile(values, 0.75), _round),
                    max_w = None,
                    max = np.max(values)
                ),
                grid = Bunch(
                    uniform = self._createUniformGrid(values, isInteger, uniformGridBins),
                    distributionBased = self._createPercentilesGrid(values, isInteger, distributionsBasedBins),
                ),
                intervals = Bunch(
                    uniform = self._createIntervals(self._createUniformGrid(values, isInteger, uniformGridBins)),
                    distributionBased = self._createIntervals(self._createPercentilesGrid(values, isInteger, distributionsBasedBins)),
                ), 
                correlations = None,
                singlePartialDependence = None,
                influence2D = Bunch(
                    uniform = Bunch(
                        influenceTo = Bunch(
                            overallScore = 0,
                            scores = {},
                            scoreVectors = {},
                            scoreVectorsSigned = {}
                        ),
                        influenceFrom = Bunch(
                            overallScore = 0,
                            scores = {},
                            scoreVectors = {},
                            scoreVectorsSigned = {}
                        ),
                        clustersInfluenceFrom = [] ## come influenceFrom ma per ogni cluster
                    ),
                    distributionBased =  Bunch(
                        influenceTo = Bunch(
                            overallScore = 0,
                            scores = {},
                            scoreVectors = {},
                            scoreVectorsSigned = {}
                        ),
                        influenceFrom = Bunch(
                            overallScore = 0,
                            scores = {},
                            scoreVectors = {},
                            scoreVectorsSigned = {}
                        ),
                        clustersInfluenceFrom = [] ## come influenceFrom ma per ogni cluster
                    ),
                ),
                clusters = []
            )
            iqr = f.distribution.q3 - f.distribution.q1
            f.distribution.min_w = round( max(f.distribution.q1 - (1.5 * iqr), f.distribution.min), _round)
            f.distribution.max_w = round( min(f.distribution.q3 + (1.5 * iqr), f.distribution.max), _round)
            self.features.append(f)

        #create projections
        if createProjection:
            self.projections = Bunch(
                #isomap = MinMaxScaler().fit_transform(Isomap(n_components=2).fit_transform(self.data)),
                mds = MinMaxScaler().fit_transform(MDS(n_components=2, random_state=0).fit_transform(self.data)),
                pca = MinMaxScaler().fit_transform(PCA(n_components=2, random_state=0).fit_transform(self.data)),
                #tsne = MinMaxScaler().fit_transform(TSNE(n_components=2, random_state=0, init="pca", learning_rate="auto").fit_transform(self.data))
            )
        else:
            self.projections = Bunch(
                #isomap = MinMaxScaler().fit_transform(Isomap(n_components=2).fit_transform(self.data)),
                mds = np.full_like(self.data, 0),
                pca = np.full_like(self.data, 0)
                #tsne = MinMaxScaler().fit_transform(TSNE(n_components=2, random_state=0, init="pca", learning_rate="auto").fit_transform(self.data))
            )

        #correlations
        for i in range(len(self.features)):
            f1 = self.features[i]
            f1.correlations = {}
            for j in range(len(self.features)):
                if(i!=j):
                    f1.correlations[j] = round(np.corrcoef(self.data[:,i], self.data[:,j])[0, 1], _round)

    def getTupleHyperphere(self, tupleIdx, samplingRatio=0.2):
        tuple = self.data[tupleIdx,:]
        possibleValues = [[] for _ in range(len(self.features))]
        for i, f in enumerate(self.features):
            v = tuple[i]
            intervalIdx = None #intervallo dove ricade la tupla
            for j, interval in enumerate(f.intervals.uniform):
                if interval.isLast:
                    if v >= interval.minValue and v < interval.maxValue:
                        intervalIdx = j
                        break
                else:
                    if v >= interval.minValue and v <= interval.maxValue:
                        intervalIdx = j
                        break
            
            idxArr = [intervalIdx-2, intervalIdx-1, intervalIdx, intervalIdx+1, intervalIdx+2]
            #idxArr = [intervalIdx-1, intervalIdx, intervalIdx+1]
            idxArr = list(filter(lambda j: j>=0 and j<len(f.intervals.uniform), idxArr))
            for idx in idxArr:
                #possibleValues[i].append(f.intervals.uniform[idx].minValue)
                possibleValues[i].append(f.intervals.uniform[idx].targetValue)
                #possibleValues[i].append(f.intervals.uniform[idx].maxValue)

        hypersphere = np.array(list(itertools.product(*possibleValues)))
        #sampling
        np.random.seed(0)
        np.random.shuffle(hypersphere)
        hypersphere = hypersphere[0:int(len(hypersphere)*samplingRatio),:]
        hypersphere[0] = tuple ## metto paziente iniziale come tupla 0

        df = pd.DataFrame(hypersphere, columns=[f.name for f in self.features])
        df[self.classColumn] = self.labels[tupleIdx]
        for f in self.features:
            if f.isInteger:
                df = df.astype({f.name: int})
        return df

    def _createUniformGrid(self, values, isInteger, bins):
        #create uniform grid
        grid = np.linspace(values.min(), values.max(), num=bins)
        grid = np.around(grid, _round)
        if isInteger:
            grid = np.around(grid, 0).astype(int)
        grid = np.unique(grid)
        return grid
        
    
    def _createPercentilesGrid(self, values, isInteger, bins):
        #create grid with percentiles
        #grid = np.percentile(values, range(0, 101, 2)) #max 21 valori
        grid = np.quantile(values, np.linspace(0, 1, num=bins))
        grid = np.around(grid, _round)
        if isInteger:
            grid = np.around(grid, 0).astype(int)
        grid = np.unique(grid)
        return grid


    def _createIntervals(self, grid): #TODO da controllare perchè c'è qualche errore
        '''create intervals from a list of grid values'''
        intervals = []
        
        intervals.append(Bunch(
            id = 0,
            minValue = grid[0],
            targetValue = grid[0],
            maxValue = round(grid[0] + ((grid[1] - grid[0]) / 2), _round),
            isLast = False
        ))
        for i in range(1, len(grid) - 1):
            intervals.append(Bunch(
                id = i,
                minValue = round(grid[i - 1] + ((grid[i] - grid[i - 1]) / 2), _round),
                targetValue = grid[i],
                maxValue = round(grid[i] + ((grid[i + 1] - grid[i]) / 2), _round),
                isLast = False
            ))

        n = len(grid)-1
        intervals.append(Bunch(
            id = n,
            minValue = round(grid[n - 1] + ((grid[n] - grid[n - 1]) / 2), _round),
            targetValue = grid[n],
            maxValue = grid[n],
            isLast = True
        ))

        return intervals
    #
    #
    #
    def getFeatures(self):
        return self.features

    def getTuples(self):
        tuples = []
        for i in range(len(self.data)):
            tuples.append(Bunch(
                id = i,
                data = self.data[i],
                label = self.labels[i],
                numericLabel = int(self.labels[i] == self.targetLabel),
                projections = {k : self.projections[k][i] for k in self.projections}
            ))
        return tuples

    def setSinglePartialDependence(self, spd):
        for f in self.features:
            f.singlePartialDependence = spd[f.id]
            for intervalType in spd[f.id]:
                for c in spd[f.id][intervalType]['iceClusters']:
                    f.clusters.append(c['tuples'])

    
    def __influence2D(self, pdp1D, pdp2D, axis=1): ##metrica graziano
        ''' 
        How much pdp1D CHANGES wrt pdp2D.
        pdp2D is in form of a matrix
        '''
        __round = 6
        diff = np.full_like(pdp1D, np.nan)
        diffSigns = np.full_like(pdp1D, np.nan)
        for k in range(len(pdp1D)):
            v = pdp1D[k]
            arr = None
            if axis == 0:
                arr = pdp2D[:,k]  
            else:
                arr = pdp2D[k,:]
            
            #diff[k] = np.mean((np.abs(arr - v)) / (max(1-v, v-0)))
            #diff[k] = np.mean(np.sqrt(np.abs(arr - v)) / np.sqrt(max(1-v, v-0)))
            diff[k] = np.mean(np.log(1 + np.abs(arr - v)) / np.log(1 + max(1-v, v-0)))
            diffSigns[k] = np.sign( np.sign(arr - v).mean() )

        signedDiff = np.around(diff * diffSigns, __round)
        overallDiff = round( diff.mean(), __round)
        diff = np.around(diff, __round)
        return diff, overallDiff, signedDiff
        

    def setFeatureInfluence2D(self, partialDependence2D):
        __round = 6
        def arrayToMatrix(arr, nR, nC):
            getRow = lambda index: int(np.floor(index / nC))
            getCol = lambda index: index % nC
            matrix = np.full((nR, nC), np.nan, dtype=float)
            for index, v in enumerate(arr):
                matrix[getRow(index), getCol(index)] = v
            return matrix

        ''' global '''
        for intervalType in ["uniform", "distributionBased"]:
            influenceMatrix = np.full((len(self.features), len(self.features)), 0, dtype=float) ## -> andrebbe messo nan ma poi da errore nella trasformazione in json, così si abbassa la media
            influenceMatrixDiff = [[None for _i in range(len(self.features))] for _j in range(len(self.features))]
            influenceMatrixSignedDiff = [[None for _i in range(len(self.features))] for _j in range(len(self.features))]
            
            for i, f1 in enumerate(self.features): #x (j)
                nCols = len(f1.grid[intervalType])
                for j, f2 in enumerate(self.features): # y (i)
                    if f1.id == f2.id: continue
                    singlePdp2 = f2.singlePartialDependence[intervalType]["pd"]
                    nRows = len(f2.grid[intervalType])
                    key = f"{f1.id}-{f2.id}"
                    pdpMatrix = arrayToMatrix(partialDependence2D[intervalType][key]["pdp"], nRows, nCols)
                    diff, overallDiff, signedDiff = self.__influence2D(singlePdp2, pdpMatrix, axis=1) #quanto f1 influenza f2 -> proiezione axis=1
                    influenceMatrix[i,j] = overallDiff
                    influenceMatrixDiff[i][j] = diff
                    influenceMatrixSignedDiff[i][j] = signedDiff

            for i, f1 in enumerate(self.features):
                f1.influence2D[intervalType].influenceTo.overallScore = round( np.nanmean(influenceMatrix[i,:]) , _round)
                f1.influence2D[intervalType].influenceFrom.overallScore = round( np.nanmean(influenceMatrix[:,i]) , _round)
                for j, f2 in enumerate(self.features):
                    f1.influence2D[intervalType].influenceTo.scores[f2.id] = influenceMatrix[i,j]
                    f1.influence2D[intervalType].influenceFrom.scores[f2.id] = influenceMatrix[j,i]

                    f1.influence2D[intervalType].influenceTo.scoreVectors[f2.id] = influenceMatrixDiff[i][j]
                    f1.influence2D[intervalType].influenceFrom.scoreVectors[f2.id] = influenceMatrixDiff[j][i]

                    f1.influence2D[intervalType].influenceTo.scoreVectorsSigned[f2.id] = influenceMatrixSignedDiff[i][j]
                    f1.influence2D[intervalType].influenceFrom.scoreVectorsSigned[f2.id] = influenceMatrixSignedDiff[j][i]

        
        ''' cluster based influence from (f1 influenced by f2)'''
        for intervalType in ["uniform", "distributionBased"]:
            for _, f1 in enumerate(self.features): #x
                nCols = len(f1.grid[intervalType])
                for k, cl in enumerate(f1.singlePartialDependence[intervalType]["iceClusters"]):
                    
                    influencedOverall = np.full(len(self.features), 0, dtype=float) ## -> andrebbe messo nan ma poi da errore nella trasformazione in json
                    influencedDiff = [np.nan for _ in range(len(self.features))]
                    influencedDiffSigned = [np.nan for _ in range(len(self.features))]

                    tuples = cl["tuples"]
                    singlePdp1 = cl["pd"]
                    for j, f2 in enumerate(self.features): # y
                        if f1.id == f2.id: continue
                        nRows = len(f2.grid[intervalType])
                        key = f"{f1.id}-{f2.id}"

                        if len(tuples) > 0: #else empty cluster
                            ice = partialDependence2D[intervalType][key]["ice"]
                            pdp2Darray = np.around(np.mean(ice[tuples,:], axis=0), 4) #pd = media sulle colonne
                            pdpMatrix = arrayToMatrix(pdp2Darray, nRows, nCols)

                            diff, overallDiff, signedDiff = self.__influence2D(singlePdp1, pdpMatrix, axis=0) #quanto f2 influenza f1 -> proiezione axis=0
                            
                            influencedDiff[j] =  diff
                            influencedDiffSigned[j] = signedDiff
                            influencedOverall[j] = overallDiff

                    ##assegno risultato
                    r = Bunch(
                            clusterIndex = k,
                            overallScore = round( np.nanmean(influencedOverall) , _round),
                            scores = {f.id : np.nan_to_num(influencedOverall[z]) for z,f in enumerate(self.features) },
                            scoreVectors = {f.id : np.nan_to_num(influencedDiff[z]) for z,f in enumerate(self.features) },
                            scoreVectorsSigned = {f.id : np.nan_to_num(influencedDiffSigned[z]) for z,f in enumerate(self.features) },
                        )
                    f1.influence2D[intervalType].clustersInfluenceFrom.append(r)


        
