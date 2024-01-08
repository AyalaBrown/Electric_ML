import pyodbc
import pandas as pd

server = '192.168.16.3'
database = 'electric_ML'
username = 'Ayala'
password = 'isr1953'

cnxn = pyodbc.connect('DRIVER={SQL Server};SERVER='+server+';DATABASE='+database+';UID='+username+';PWD='+ password)
cursor = cnxn.cursor()
def read_data():
    query = "exec dbo.GetElectricPlan_trackSoc '20240107';"
    busses = pd.read_sql(query, cnxn)
    query = "exec isrProject_test.dbo.GetChargersList;"
    chargers = pd.read_sql(query, cnxn)
    query = "exec dbo.GetElectricRate_PerDate '20240107';"
    prices = pd.read_sql(query, cnxn)
    data = {"busses": busses.to_dict(orient='records'), "maxAmper": 650, "chargers": [
            {"chargerCode": 1, "connectorId":1, "voltage":650},
            {"chargerCode": 1, "connectorId":2, "voltage":650},
            {"chargerCode": 2, "connectorId":1, "voltage":648},
            {"chargerCode": 2, "connectorId":2, "voltage":648},
            {"chargerCode": 3, "connectorId":1, "voltage":652},
            {"chargerCode": 3, "connectorId":2, "voltage":652},
            {"chargerCode": 4, "connectorId":1, "voltage":650},
            {"chargerCode": 4, "connectorId":2, "voltage":650}
        ], "prices": prices.to_dict(orient='records')}
    return data

