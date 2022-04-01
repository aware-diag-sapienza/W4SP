import numpy as np
import pandas as pd
import json
from json_encoder import NumpyEncoder
from dataset import Dataset
from timelog import TimeLog


class Worker:
    def __init__(self, datasetFile, classifierFn, loadedDataset=None, trainedClassifier=None, workerName="G"):
        self.workerName = workerName
        self.dataset = loadedDataset if loadedDataset is not None else self.__loadDataset(datasetFile)
        self.classifier = trainedClassifier if trainedClassifier is not None else self.__trainClassifier(classifierFn) 

        self.__partialDependence_1D = self.__computePartialDependence_1D()
        self.__partialDependence_2D = self.__computePartialDependence_2D()

        self.dataset.setSinglePartialDependence(self.__partialDependence_1D)
        self.dataset.setFeatureInfluence2D(self.__partialDependence_2D)
    #
    #
    #
    def __loadDataset(self, datasetFile):
        log = TimeLog()
        log.print(f"Loading dataset {datasetFile.stem}", False)
        dname = datasetFile.stem.split("-")[0] # dataset name
        dclass = datasetFile.stem.split("-")[1] # class columns
        dlabel = datasetFile.stem.split("-")[2] # target label

        df = pd.read_csv(datasetFile)
        dataset = Dataset(dname, df, dclass, dlabel)
        log.print("Dataset loaded")
        return dataset

    def __trainClassifier(self, classifierFn):
        dataset = self.dataset
        log = TimeLog()
        classifier = classifierFn(dataset.data, dataset.labels)
        log.print("Classifier trained")
        return classifier

    def __computePartialDependence_1D(self):
        dataset = self.dataset
        classifier = self.classifier
        log = TimeLog()
        result = {}
        for f in dataset.features:
            result[f.id] = {}
            allGrids = {
                "uniform": f.grid.uniform,
                "distributionBased": f.grid.distributionBased
            }
            for intervalType in allGrids:
                grid = allGrids[intervalType]
                pdp, ice, iceClusters = classifier.getSinglePartialDependence(dataset.targetLabel, f.id, grid)
                result[f.id][intervalType] = {
                    "pd": pdp,
                    "iceClusters": iceClusters,
                    "featureImportance": self.__computeFeatureImportance(pdp, iceClusters),
                    #"featureInfluence1D": self.__computeFeatureInfluence1D(pdp, iceClusters)
                }
        log.print("Computed PartialDependence 1D")
        return result

    def __computeFeatureImportance__Greenweel(self, pdp, iceClusters):
        ## Greenweel et al. da libro
        __round = 6
        def greenwellMetric(arr):
            k = len(arr)
            x = (1 / (k - 1)) * arr.sum() #primo componente della formula
            y = (1 / k) * np.square(arr).sum() #secondo componente della formula
            return np.sqrt(x - y)
        
        result = {
            "global": round( greenwellMetric(pdp) , __round),
            "clustersBased": round( np.average([greenwellMetric(c["pd"]) for c in iceClusters], weights=[len(c["tuples"]) for c in iceClusters]) , __round),
        }
        return result

    def __computeFeatureImportance(self, pdp, iceClusters):
        __round = 6
        def metric(arr):
            v = arr.mean()
            nom = np.log(1 + np.abs(arr - v))
            den = np.log(1 + max(1-v, v-0))
            return (nom / den).mean()
        
        result = {
            "global": round( metric(pdp) , __round),
            "clustersBased": round( np.average([metric(c["pd"]) for c in iceClusters], weights=[len(c["tuples"]) for c in iceClusters]) , __round),
        }
        return result


    def __computePartialDependence_2D(self):
        dataset = self.dataset
        classifier = self.classifier
        log = TimeLog()
        result = {}
        for t in ["uniform", "distributionBased"]:
            result[t] = {}
            for i, fx in enumerate(dataset.features):
                for j, fy in enumerate(dataset.features):
                    if i == j: continue
                    key = f"{fx.id}-{fy.id}"
                    gridX = fx.grid[t]
                    gridY = fy.grid[t]
                    pdp, ice = classifier.getDoublePartialDependence(dataset.targetLabel, fx.id, fy.id, gridX, gridY)
                    result[t][key] = {
                        "pdp":  pdp,
                        "ice": ice
                    }
        log.print("Computed PartialDependence 2D")
        return result
    #
    #
    #
    def getTuples(self, toJson=True):
        result = self.dataset.getTuples()
        if toJson:
            result = json.dumps(result, cls=NumpyEncoder)
        return result
    
    def getFeatures(self, toJson=True):
        result = self.dataset.getFeatures()
        if toJson:
            result = json.dumps(result, cls=NumpyEncoder)
        return result
    
    def getPartialDependence_2D(self, fxId, fyId, toJson=True):
        result = {}
        for t in ["uniform", "distributionBased"]:
            result[t] = {}
            key = f"{fxId}-{fyId}"
            fx = list(filter(lambda f: f.id == fxId, self.dataset.features))[0]
            fy = list(filter(lambda f: f.id == fyId, self.dataset.features))[0]
            data = self.__partialDependence_2D[t][key]
            
            result[t] = {
                "fx": fx.id,
                "fy": fy.id,
                "pdp": data["pdp"],
                "iceClusters": {
                    "x": [],
                    "y": [],
                    "xTuples": [],
                    "yTuples": []
                }
            }

            #ice clusters of fx
            for cl in fx.singlePartialDependence[t]["iceClusters"]:
                if len(cl["tuples"]) != 0:
                    idx = cl["tuples"] # tuple da considerare
                    result[t]["iceClusters"]["xTuples"].append(idx)
                    clusterPdp = np.around(np.mean(data["ice"][idx,:], axis=0), 3) #pd = media sulle colonne
                    result[t]["iceClusters"]["x"].append(clusterPdp)
                else:
                    result[t]["iceClusters"]["x"].append([])
            #ice clusters of fy
            for cl in fy.singlePartialDependence[t]["iceClusters"]:
                if len(cl["tuples"]) != 0:
                    idx = cl["tuples"] # tuple da considerare
                    result[t]["iceClusters"]["yTuples"].append(idx)
                    clusterPdp = np.around(np.mean(data["ice"][idx,:], axis=0), 3) #pd = media sulle colonne
                    result[t]["iceClusters"]["y"].append(clusterPdp)
                else:
                    result[t]["iceClusters"]["y"].append([])
                    
        if toJson:
            result = json.dumps(result, cls=NumpyEncoder)
        return result

    

if __name__ == "__main__":
    from pathlib import Path
    from classifier import NeuralNetworkClassifier
    DATASET_FILE = Path("./datasets/Diabetes-Class-T.csv")
    CLASSIFIER = NeuralNetworkClassifier
    worker = Worker(DATASET_FILE, CLASSIFIER)

    print(worker.getPartialDependence_2D(1, 2))