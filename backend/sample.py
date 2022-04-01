import numpy as np
import pandas as pd
from dataset import Dataset
from pathlib import Path
import itertools

DATASET_FILE = Path("./datasets/Diabetes-Class-T.csv")
SELECTED_TUPLE = 100
#
#
def loadDataset(datasetFile):
    dname = datasetFile.stem.split("-")[0] # dataset name
    dclass = datasetFile.stem.split("-")[1] # class columns
    dlabel = datasetFile.stem.split("-")[2] # target label

    df = pd.read_csv(datasetFile)
    dataset = Dataset(dname, df, dclass, dlabel)
    return dataset
#
#
dataset = loadDataset(DATASET_FILE)
hs = dataset.getTupleHyperphere(SELECTED_TUPLE)
print(hs)
print('\n\n')
print(hs.shape)


'''
tuple = dataset.data[SELECTED_TUPLE,:]
possibleValues = [[] for _ in range(len(dataset.features))]
for i, f in enumerate(dataset.features):
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
    
    #idxArr = [intervalIdx-2, intervalIdx-1, intervalIdx, intervalIdx+1, intervalIdx+2]
    idxArr = [intervalIdx-1, intervalIdx, intervalIdx+1]
    idxArr = list(filter(lambda j: j>=0 and j<len(f.intervals.uniform), idxArr))
    for idx in idxArr:
        #possibleValues[i].append(f.intervals.uniform[idx].minValue)
        possibleValues[i].append(f.intervals.uniform[idx].targetValue)
        #possibleValues[i].append(f.intervals.uniform[idx].maxValue)


data = np.array(list(itertools.product(*possibleValues)))
print(data)
print('\n\n')
print(data.shape)
'''