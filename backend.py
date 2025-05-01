from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)

@app.route('/consultar-nota', methods=['POST'])
def consultar_nota():
    try:
        data = request.get_json()
        nota = data.get('nota')
        fornecedor = data.get('fornecedor')
        
        # Simulação de consulta
        return jsonify({
            "success": True,
            "nota": nota,
            "fornecedor": fornecedor,
            "data": "10/05/2024"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)