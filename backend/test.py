import itertools
from pathlib import Path

import numpy as np
import pandas as pd

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


def createCharts(df, datasetFile, folder):
    import matplotlib.pyplot as plt
    import seaborn as sns
    sns.set_theme(style="whitegrid")
    
    dataset = loadDataset(datasetFile)

    for e in ['AbsoluteError', 'RelativeError']:
        
        '''# 2D -> 1D global
        fig, ax = plt.subplots(figsize=(11, 6))
        sns.boxplot(ax=ax, data=df, x='Projection Type', y=e, palette='pastel', linewidth=0.75, saturation=0.5)
        #ax.set(ylim=(0, 0.5))
        plt.savefig(folder.joinpath(f'boxplot-{e}.pdf'))
        plt.clf()'''

        # 2D -> 1D boxplots per features (1D)
        currentFolder = folder.joinpath(e)
        currentFolder.mkdir(exist_ok = True)

        # set name of features 
        df_filtered = df[ (df['PDP Order']==2) & (df['Projection Order']==1)]
        df_filtered['PDP'] = df_filtered['PDP'].map(lambda d: dataset.getFeatures()[int(d.split('-')[0])].name + '-' + dataset.getFeatures()[int(d.split('-')[1])].name)
        df_filtered['Projection'] = df_filtered['Projection'].map(lambda i: dataset.getFeatures()[int(i)].name)
        
        fig, ax = plt.subplots(figsize=(11, 6))
        sns.boxplot(ax=ax, data=df_filtered, x='Projection', y=e, palette='pastel', linewidth=0.75, saturation=0.5)
        #ax.set(ylim=(0, 0.5))
        plt.savefig(currentFolder.joinpath(f'boxplot-features-{e}-2D_1D.pdf'))
        plt.clf()

         
        var = df_filtered['Projection'].map(lambda i: dataset.getFeatures()[int(i)].name)
        df_filtered['PDP'] = df_filtered['PDP'].map(lambda d: dataset.getFeatures()[int(d.split('-')[0])].name + '-' + dataset.getFeatures()[int(d.split('-')[1])].name)
        df_filtered['Projection'] = df_filtered['Projection'].map(lambda i: dataset.getFeatures()[int(i)].name)
        
        fig, ax = plt.subplots(figsize=(11, 6))
        sns.boxplot(ax=ax, data=df_filtered, x='Projection', y=e, palette='pastel', linewidth=0.75, saturation=0.5)
        #ax.set(ylim=(0, 0.5))
        plt.savefig(currentFolder.joinpath(f'boxplot-features-{e}-2D_1D.pdf'))
        plt.clf()
        



DATASET_FILE = Path('./datasets/Diabetes-Class-T.csv')
folder = Path('evaluation_results')
folder.mkdir(exist_ok=True)
xlsFile = folder.joinpath('proj.xlsx')
df = pd.read_excel(xlsFile)

createCharts(df, DATASET_FILE, folder)
