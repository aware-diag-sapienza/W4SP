from pathlib import Path
from flask import Flask, request, Response
from flask_cors import CORS
from classifier import NeuralNetworkClassifier
from worker import Worker
#
#
#
def main(port, datasetFile, classifierClass):
    workerGlobal = Worker(datasetFile, classifierClass, workerName="Global")

    app = Flask("PDVA Server", static_folder="web", static_url_path="", template_folder="web") 
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
    CORS(app)
    #
    #
    @app.route("/global/tuples.json", methods=['GET'])
    def route_global_tuples(): # pylint: disable=unused-variable
        data = workerGlobal.getTuples()
        return Response(data, mimetype="application/json")
    #
    #
    @app.route("/global/features.json", methods=['GET'])
    def route_global_features(): # pylint: disable=unused-variable
        data = workerGlobal.getFeatures()
        return Response(data, mimetype="application/json")
    #
    #
    @app.route("/global/pdp_2d/<fx>/<fy>/pdp.json", methods=['GET', 'POST'])
    def route_global_pdp_2d(fx, fy): # pylint: disable=unused-variable
        #fx = int(request.args.get('fx'))
        #fy = int(request.args.get('fy'))
        data = workerGlobal.getPartialDependence_2D(int(fx), int(fy))
        return Response(data, mimetype="application/json")
    #
    #
    #
    #
    #
    #
    #
    #
    #
    #
    app.run(host="0.0.0.0", port=port, debug=False)
#
#
#
if __name__ == "__main__":
    PORT = 11760
    DATASET_FILE = Path("./datasets/Diabetes-Class-T.csv")
    CLASSIFIER = NeuralNetworkClassifier

    main(PORT, DATASET_FILE, CLASSIFIER)