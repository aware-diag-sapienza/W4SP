import itertools
from pathlib import Path

import numpy as np
import pandas as pd

from classifier import NeuralNetworkClassifier
from dataset import Dataset
from timelog import TimeLog


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
    for (i,j,k) in itertools.combinations(range(len(dataset.features)), 3):
        f1 = dataset.features[i]
        f2 = dataset.features[j]
        f3 = dataset.features[k]
        key = f'{f1.id}-{f2.id}-{f3.id}'
        grid1 = f1.grid.uniform
        grid2 = f2.grid.uniform
        grid3 = f3.grid.uniform
        pdp = classifier.computePartialDependenceArray_3D(dataset.targetLabel, f1.id, f2.id, f3.id, grid1, grid2, grid3)
        result[key] = pdp
    log.print('Computed PartialDependence 3D')
    return result

def computePartialDependence_4D(dataset, classifier):
    log = TimeLog()
    result = {}
    for (i,j,k,z) in itertools.combinations(range(len(dataset.features)), 4):
        f1 = dataset.features[i]
        f2 = dataset.features[j]
        f3 = dataset.features[k]
        f4 = dataset.features[z]
        key = f'{f1.id}-{f2.id}-{f3.id}-{f4.id}'
        grid1 = f1.grid.uniform
        grid2 = f2.grid.uniform
        grid3 = f3.grid.uniform
        grid4 = f4.grid.uniform
        pdp = classifier.computePartialDependenceArray_4D(dataset.targetLabel, f1.id, f2.id, f3.id, f4.id, grid1, grid2, grid3, grid4)
        result[key] = pdp
    log.print('Computed PartialDependence 4D')
    return result


def projectionAbsoluteError(m_arr, v_arr):
    std_arr = np.sqrt(v_arr)
    error = np.mean(std_arr.flatten())
    return error

def projectionRelativeError(m_arr, v_arr):
    std_arr = np.sqrt(v_arr)
    error = np.mean(std_arr.flatten()) / np.mean(m_arr.flatten())
    return error

def projectionClassificationError(m_arr, v_arr):
    #std_arr = np.sqrt(v_arr)
    #error = np.mean(std_arr.flatten()) / np.mean(m_arr.flatten())
    return 0

def projectionErrors_all(m_arr, v_arr):
    return {
        'AbsoluteError': projectionAbsoluteError(m_arr, v_arr),
        'RelativeError': projectionRelativeError(m_arr, v_arr),
        'ClassificationError': projectionClassificationError(m_arr, v_arr)
    }


def project_2Dto1D(pdp, f): #feature: 0 or 1
    m_arr = np.full(pdp.shape[f], 0.0)
    v_arr = np.full(pdp.shape[f], 0.0)

    for i in range(pdp.shape[f]):
        idx = [':', ':']
        idx[f] = str(i)
        idx = ','.join(idx)
        p = eval(f'pdp[{idx}]')
        m_arr[i] = np.mean(p.flatten())
        v_arr[i] = np.var(p.flatten())
    
    return projectionErrors_all(m_arr, v_arr)

def project_3Dto1D(pdp, f): #feature: 0 or 1 or 2
    m_arr = np.full(pdp.shape[f], 0.0)
    v_arr = np.full(pdp.shape[f], 0.0)

    for i in range(pdp.shape[f]):
        idx = [':', ':', ':']
        idx[f] = str(i)
        idx = ','.join(idx)
        p = eval(f'pdp[{idx}]')
        m_arr[i] = np.mean(p.flatten())
        v_arr[i] = np.var(p.flatten())
    
    return m_arr, v_arr, projectionErrors_all(m_arr, v_arr)

def project_3Dto2D(pdp, f1, f2):
    m_arr = np.full((pdp.shape[f1],pdp.shape[f2]), 0.0)
    v_arr = np.full((pdp.shape[f1],pdp.shape[f2]), 0.0)
    
    if f1 == f2: raise Exception('Error f1 and f2 are equals')

    for i in range(pdp.shape[f1]):
        for j in range(pdp.shape[f2]):
            idx = [':', ':', ':']
            idx[f1] = str(i)
            idx[f2] = str(j)
            idx = ','.join(idx)
            p = eval(f'pdp[{idx}]')
            m_arr[i,j] = np.mean(p.flatten())
            v_arr[i,j] = np.var(p.flatten())
    
    return projectionErrors_all(m_arr, v_arr)


def project_4Dto3D(pdp, f1, f2, f3):
    m_arr = np.full((pdp.shape[f1],pdp.shape[f2],pdp.shape[f3]), 0.0)
    v_arr = np.full((pdp.shape[f1],pdp.shape[f2],pdp.shape[f3]), 0.0)

    if len(np.unique([f1, f2, f3])) < 3:
        raise Exception('Att least two features are equals')

    for i in range(pdp.shape[f1]):
        for j in range(pdp.shape[f2]):
            for k in range(pdp.shape[f3]):
                idx = [':', ':', ':', ':']
                idx[f1] = str(i)
                idx[f2] = str(j)
                idx[f3] = str(k)
                idx = ','.join(idx)
                p = eval(f'pdp[{idx}]')
                m_arr[i,j,k] = np.mean(p.flatten())
                v_arr[i,j,k] = np.var(p.flatten())

    return projectionErrors_all(m_arr, v_arr)


def project_4Dto2D(pdp, f1, f2):
    m_arr = np.full((pdp.shape[f1],pdp.shape[f2]), 0.0)
    v_arr = np.full((pdp.shape[f1],pdp.shape[f2]), 0.0)

    if f1 == f2: raise Exception('Error f1 and f2 are equals')

    for i in range(pdp.shape[f1]):
        for j in range(pdp.shape[f2]):
            idx = [':', ':', ':', ':']
            idx[f1] = str(i)
            idx[f2] = str(j)
            idx = ','.join(idx)
            p = eval(f'pdp[{idx}]')
            m_arr[i,j] = np.mean(p.flatten())
            v_arr[i,j] = np.var(p.flatten())

    return projectionErrors_all(m_arr, v_arr)


def project_4Dto1D(pdp, f1):
    m_arr = np.full(pdp.shape[f1], 0.0)
    v_arr = np.full(pdp.shape[f1], 0.0)

    for i in range(pdp.shape[f1]):
        idx = [':', ':', ':', ':']
        idx[f1] = str(i)
        idx = ','.join(idx)
        p = eval(f'pdp[{idx}]')
        m_arr[i] = np.mean(p.flatten())
        v_arr[i] = np.var(p.flatten())

    return projectionErrors_all(m_arr, v_arr)
                
    


def projectPartialDependence(pdp):
    result = []
    def pushResult(pdp_key, proj_key, errors, type_proj):
        
        result.append({
            'PDP': pdp_key,
            'Projection': proj_key,
            'PDP Order': len(pdp_key.split('-')),
            'Projection Order': len(proj_key.split('-')),
            'AbsoluteError': errors['AbsoluteError'],
            'RelativeError': errors['RelativeError'],
            'ClassificationError': errors['ClassificationError'],
            'Projection Type': type_proj
        })
    
    
    for pdp_key in pdp:
        flist = list(map(int, pdp_key.split('-')))
        ord_PDP = len(flist)
        P = pdp[pdp_key] #pdp

        if ord_PDP == 1: continue
        
        if ord_PDP == 2: 
            # 2D to 1D
            for f in [0,1]:
                errors = project_2Dto1D(P, f)
                proj_key = f'{flist[f]}'
                type_proj = '2D -> 1D'
                pushResult(pdp_key, proj_key, errors, type_proj)
        
        if ord_PDP == 3:
            # 3D to 1D
            for f in [0,1,2]:
                errors = project_3Dto1D(P, f)
                proj_key = f'{flist[f]}'
                type_proj = '3D -> 1D'
                pushResult(pdp_key, proj_key, errors, type_proj)
            # 3D to 2D
            for f1,f2 in itertools.combinations([0,1,2], 2):
                errors = project_3Dto2D(P, f1, f2)
                proj_key = f'{flist[f1]}-{flist[f2]}'
                type_proj = '3D -> 2D'
                pushResult(pdp_key, proj_key, errors, type_proj)
        
        if ord_PDP == 4:
            # 4D to 1D
            for f in [0,1,2,3]:
                errors = project_4Dto1D(P, f)
                proj_key = f'{flist[f]}'
                type_proj = '4D -> 1D'
                pushResult(pdp_key, proj_key, errors, type_proj)
            # 4D to 2D
            for f1,f2 in itertools.combinations([0,1,2,3], 2):
                errors = project_4Dto2D(P, f1, f2)
                proj_key = f'{flist[f1]}-{flist[f2]}'
                type_proj = '4D -> 2D'
                pushResult(pdp_key, proj_key, errors, type_proj)
            # 4D to 3D
            for f1,f2,f3 in itertools.combinations([0,1,2,3], 3):
                errors = project_4Dto3D(P, f1, f2, f3)
                proj_key = f'{flist[f1]}-{flist[f2]}'
                type_proj = '4D -> 3D'
                pushResult(pdp_key, proj_key, errors, type_proj)

    return pd.DataFrame(result)


def createCharts(df, folder):
    import matplotlib.pyplot as plt
    import seaborn as sns
    sns.set_theme(style="whitegrid")
    
    for e in ['AbsoluteError', 'RelativeError', 'ClassificationError']:
        fig, ax = plt.subplots(figsize=(11, 6))
        sns.boxplot(ax=ax, data=df, x='Projection Type', y=e, palette='pastel', linewidth=0.75, saturation=0.5)
        #ax.set(ylim=(0, 0.5))
        plt.savefig(folder.joinpath(f'boxplot-{e}.pdf'))
        plt.clf()

def extractStatistics(df, folder):
    df_arr = []
    for e in ['AbsoluteError', 'RelativeError', 'ClassificationError']:
        df_arr.append(df[['Projection Type', e]].groupby(by=['Projection Type']).mean().rename(columns={e: f'{e} (mean)'}))
        df_arr.append(df[['Projection Type', e]].groupby(by=['Projection Type']).var().rename(columns={e: f'{e} (var)'}))
        df_arr.append(df[['Projection Type', e]].groupby(by=['Projection Type']).std().rename(columns={e: f'{e} (std)'}))
        df_arr.append(df[['Projection Type', e]].groupby(by=['Projection Type']).median().rename(columns={e: f'{e} (median)'}))

    pd.concat(df_arr, axis=1).to_excel(folder.joinpath('stats.xlsx'))



def computePartialDependence(dataset, classifier):
    result = {}
    result.update(computePartialDependence_1D(dataset, classifier))
    result.update(computePartialDependence_2D(dataset, classifier))
    #result.update(computePartialDependence_3D(dataset, classifier))
    #result.update(computePartialDependence_4D(dataset, classifier))
    return result


def main(datasetFile, classifierFn):
    folder = Path('evaluation_results')
    folder.mkdir(exist_ok=True)
    xlsFile = folder.joinpath('proj.xlsx')
    
    if not xlsFile.exists():
        dataset = loadDataset(datasetFile)
        classifier = trainClassifier(dataset, classifierFn)
        pdp = computePartialDependence(dataset, classifier)
        proj = projectPartialDependence(pdp)
        proj.to_excel(xlsFile, index=False)

    log = TimeLog()
    df = pd.read_excel(xlsFile)
    log.print(f'Loaded {xlsFile.resolve()}')
    createCharts(df, folder)
    log.print(f'Chart created')

    extractStatistics(df, folder)



if __name__ == '__main__':
    DATASET_FILE = Path('./datasets/Diabetes-Class-T.csv')
    CLASSIFIER = NeuralNetworkClassifier
    main(DATASET_FILE, CLASSIFIER)


