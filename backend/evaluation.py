from pathlib import Path
import pandas as pd
from classifier import NeuralNetworkClassifier
from dataset import Dataset
from timelog import TimeLog
import itertools
import numpy as np


def loadDataset(datasetFile):
    log = TimeLog()
    log.print(f'Loading dataset {datasetFile.stem}', False)
    dname = datasetFile.stem.split('-')[0] # dataset name
    dclass = datasetFile.stem.split('-')[1] # class columns
    dlabel = datasetFile.stem.split('-')[2] # target label
    df = pd.read_csv(datasetFile)
    dataset = Dataset(dname, df, dclass, dlabel)
    log.print('Dataset loaded')
    return dataset

def trainClassifier(dataset, classifierFn):
    log = TimeLog()
    classifier = classifierFn(dataset.data, dataset.labels)
    log.print("Classifier trained")
    return classifier

def computePartialDependence_1D(dataset, classifier):
    log = TimeLog()
    result = {}
    for f1 in dataset.features:
        key = f'{f1.id}'
        grid = f1.grid.uniform
        pdp = classifier.computePartialDependenceArray_1D(dataset.targetLabel, f1.id, grid)
        result[key] = pdp
    log.print('Computed PartialDependence 1D')
    return result

def computePartialDependence_2D(dataset, classifier):
    log = TimeLog()
    result = {}
    for (i,j) in itertools.combinations(range(len(dataset.features)), 2):
        f1 = dataset.features[i]
        f2 = dataset.features[j]
        key = f'{f1.id}-{f2.id}'
        grid1 = f1.grid.uniform
        grid2 = f2.grid.uniform
        pdp = classifier.computePartialDependenceArray_2D(dataset.targetLabel, f1.id, f2.id, grid1, grid2)
        result[key] = pdp
    log.print('Computed PartialDependence 2D')
    return result

def computePartialDependence_3D(dataset, classifier):
    log = TimeLog()
    result = {}
    __n = 0
    for (i,j,z) in itertools.combinations(range(len(dataset.features)), 3):
        f1 = dataset.features[i]
        f2 = dataset.features[j]
        f3 = dataset.features[z]
        key = f'{f1.id}-{f2.id}-{f3.id}'
        grid1 = f1.grid.uniform
        grid2 = f2.grid.uniform
        grid3 = f3.grid.uniform
        pdp = classifier.computePartialDependenceArray_3D(dataset.targetLabel, f1.id, f2.id, f3.id, grid1, grid2, grid3)
        result[key] = pdp
        ###
        #__n +=1
        #if __n == 5: break
        ###
    log.print('Computed PartialDependence 3D')
    return result

def computePartialDependence(dataset, classifier):
    result = {}
    result.update(computePartialDependence_1D(dataset, classifier))
    result.update(computePartialDependence_2D(dataset, classifier))
    result.update(computePartialDependence_3D(dataset, classifier))
    return result

def project_2Dto1D(pdp, f): #feature: 0 or 1
    m_arr = None
    v_arr = None
    if f == 0:
        m_arr = np.full(pdp.shape[0], 0.0)
        v_arr = np.full(pdp.shape[0], 0.0)
        for i in range(pdp.shape[0]):
            m_arr[i] = np.mean(pdp[i,:])
            v_arr[i] = np.var(pdp[i,:])
    if f == 1:
        m_arr = np.full(pdp.shape[1], 0.0)
        v_arr = np.full(pdp.shape[1], 0.0)
        for j in range(pdp.shape[1]):
            m_arr[j] = np.mean(pdp[:,j])
            v_arr[j] = np.var(pdp[:,j])

    std_arr = np.sqrt(v_arr)
    e_arr = std_arr #/ m_arr
    error = np.mean(e_arr)

    return m_arr, v_arr, error

def project_3Dto1D(pdp, f): #feature: 0 or 1 or 2
    m_arr = None
    v_arr = None
    if f == 0:
        m_arr = np.full(pdp.shape[0], 0.0)
        v_arr = np.full(pdp.shape[0], 0.0)
        for i in range(pdp.shape[0]):
            m_arr[i] = np.mean(pdp[i,:,:].flatten())
            v_arr[i] = np.var(pdp[i,:,:].flatten())
    if f == 1:
        m_arr = np.full(pdp.shape[1], 0.0)
        v_arr = np.full(pdp.shape[1], 0.0)
        for j in range(pdp.shape[1]):
            m_arr[j] = np.mean(pdp[:,j,:].flatten())
            v_arr[j] = np.var(pdp[:,j,:].flatten())
    if f == 2:
        m_arr = np.full(pdp.shape[2], 0.0)
        v_arr = np.full(pdp.shape[2], 0.0)
        for z in range(pdp.shape[2]):
            m_arr[z] = np.mean(pdp[:,:,z].flatten())
            v_arr[z] = np.var(pdp[:,:,z].flatten())

    std_arr = np.sqrt(v_arr)
    e_arr = std_arr #/ m_arr
    error = np.mean(e_arr)

    return m_arr, v_arr, error

def project_3Dto2D(pdp, f1, f2):
    m_arr = np.full((pdp.shape[f1],pdp.shape[f2]), 0.0)
    v_arr = np.full((pdp.shape[f1],pdp.shape[f2]), 0.0)
    if f1 == 0 and f2 == 0:
        raise Exception('Error f1 and f2 are equals')
    if f1 == 1 and f2 == 0:
        for i in range(pdp.shape[f1]):
            for j in range(pdp.shape[f2]):
                p = pdp[j,i,:]
                m_arr[i,j] = np.mean(p.flatten())
                v_arr[i,j] = np.var(p.flatten())
    if f1 == 2 and f2 == 0:
        for i in range(pdp.shape[f1]):
            for j in range(pdp.shape[f2]):
                p = pdp[j,:,i]
                m_arr[i,j] = np.mean(p.flatten())
                v_arr[i,j] = np.var(p.flatten())
    if f1 == 0 and f2 == 1:
        for i in range(pdp.shape[f1]):
            for j in range(pdp.shape[f2]):
                p = pdp[i,j,:]
                m_arr[i,j] = np.mean(p.flatten())
                v_arr[i,j] = np.var(p.flatten())
    if f1 == 1 and f2 == 1:
        raise Exception('Error f1 and f2 are equals')
    if f1 == 2 and f2 == 1:
        for i in range(pdp.shape[f1]):
            for j in range(pdp.shape[f2]):
                p = pdp[:,j,i]
                m_arr[i,j] = np.mean(p.flatten())
                v_arr[i,j] = np.var(p.flatten())
    if f1 == 0 and f2 == 2:
        for i in range(pdp.shape[f1]):
            for j in range(pdp.shape[f2]):
                p = pdp[i,:,j]
                m_arr[i,j] = np.mean(p.flatten())
                v_arr[i,j] = np.var(p.flatten())
    if f1 == 1 and f2 == 2:
        for i in range(pdp.shape[f1]):
            for j in range(pdp.shape[f2]):
                p = pdp[:,:,j]
                m_arr[i,j] = np.mean(p.flatten())
                v_arr[i,j] = np.var(p.flatten())
    if f1 == 2 and f2 == 2:
        raise Exception('Error f1 and f2 are equals')

    std_arr = np.sqrt(v_arr)
    e_arr = std_arr #/ m_arr
    error = np.mean(e_arr.flatten())

    return m_arr, v_arr, error


def projectPartialDependence(pdp):
    result = []
    def pushResult(pdp_key, proj_key, cognitiveLoad_pdp, cognitiveLoad_proj, error, type_proj):
        cognitiveLoad_reduction = (float(cognitiveLoad_pdp) - float(cognitiveLoad_proj)) / float(cognitiveLoad_pdp)
        result.append({
            'PDP': pdp_key,
            'Projection': proj_key,
            'PDP Order': len(pdp_key.split('-')),
            'Projection Order': len(proj_key.split('-')),
            'Error': error,
            'CL Reduction': cognitiveLoad_reduction,
            'Projection Type': type_proj
        })
    
    
    for pdp_key in pdp:
        flist = list(map(int, pdp_key.split('-')))
        ord_PDP = len(flist)
        P = pdp[pdp_key] #pdp
        cognitiveLoad_pdp = np.prod(P.shape) #elements in the matrix
   
        if ord_PDP == 1: continue
        
        if ord_PDP == 2: 
            # 2D to 1D
            for f in [0,1]:
                m_arr, v_arr, error = project_2Dto1D(P, f)
                cognitiveLoad_proj = np.prod(m_arr.shape)
                proj_key = f'{flist[f]}'
                type_proj = '2D->1D'
                pushResult(pdp_key, proj_key, cognitiveLoad_pdp, cognitiveLoad_proj, error, type_proj)
        
        if ord_PDP == 3:
            # 3D to 1D
            for f in [0,1,2]:
                m_arr, v_arr, error = project_3Dto1D(P, f)
                cognitiveLoad_proj = np.prod(m_arr.shape)
                proj_key = f'{flist[f]}'
                type_proj = '3D->1D'
                pushResult(pdp_key, proj_key, cognitiveLoad_pdp, cognitiveLoad_proj, error, type_proj)
            # 3D to 2D
            for f1,f2 in itertools.combinations([0,1,2], 2):
                m_arr, v_arr, error = project_3Dto2D(P, f1, f2)
                cognitiveLoad_proj = np.prod(m_arr.shape)
                proj_key = f'{flist[f1]}-{flist[f2]}'
                type_proj = '3D->2D'
                pushResult(pdp_key, proj_key, cognitiveLoad_pdp, cognitiveLoad_proj, error, type_proj)

    return pd.DataFrame(result)


def createCharts(df, folder):
    import seaborn as sns
    import matplotlib.pyplot as plt
    sns.set_theme(style="whitegrid")
    fig, ax = plt.subplots(figsize=(11, 6))
    
    sns.boxplot(data=df, x='Projection Type', y='Error', palette='Set3', linewidth=0.75, saturation=0.5)
    ax.set(ylim=(0, 0.5))
    plt.savefig(folder.joinpath('boxplot-error.png'))

    sns.boxplot(data=df, x='Projection Type', y='CL Reduction', palette='Set3', linewidth=0.75, saturation=0.5)
    ax.set(ylim=(0.9, 1))
    plt.savefig(folder.joinpath('boxplot-cl.png'))

def main(datasetFile, classifierFn):
    folder = Path('evaluation_results')
    folder.mkdir(exist_ok=True)
    xlsFile = folder.joinpath('proj.xlsx')
    
    if xlsFile.exists():
        log = TimeLog()
        df = pd.read_excel(xlsFile)
        log.print(f'Loaded {xlsFile.resolve()}')
        createCharts(df, folder)
        log.print(f'Chart created')
    else:
        dataset = loadDataset(datasetFile)
        classifier = trainClassifier(dataset, classifierFn)
        pdp = computePartialDependence(dataset, classifier)
        proj = projectPartialDependence(pdp)
        proj.to_excel(xlsFile, index=False)



if __name__ == '__main__':
    DATASET_FILE = Path('./datasets/Diabetes-Class-T.csv')
    CLASSIFIER = NeuralNetworkClassifier
    main(DATASET_FILE, CLASSIFIER)



## TODO proiettare 4D