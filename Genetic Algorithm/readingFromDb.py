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
    busses = pd.read_sql(query, cnxn).to_dict(orient='records')
    query = "exec isrProject_test.dbo.GetChargersList;"
    chrgs = []
    chargers = pd.read_sql(query, cnxn).to_dict(orient='records')
    for i in range(0, len(chargers)):
        if chargers[i]["voltage"] > 0:
            chrgs.append({"chargerCode": chargers[i]["code"], "connectorId": 1, "voltage": chargers[i]["voltage"]})
            chrgs.append({"chargerCode": chargers[i]["code"], "connectorId": 2, "voltage": chargers[i]["voltage"]})
    query = "exec dbo.GetElectricRate_PerDate '20240107';"
    prices = pd.read_sql(query, cnxn).to_dict(orient='records')
    query = "exec dbo.GetElectricRate_PerDate '20240108';"
    prices2 = pd.read_sql(query, cnxn).to_dict(orient='records')
    prices.extend(prices2)
    query = "exec dbo.GetElectricAmperLevels;"
    amperLevels = pd.read_sql(query, cnxn).to_dict(orient='records')
    data = {"busses": busses, "maxAmper": 2500, "chargers": chrgs, "prices": prices, "amperLevels": amperLevels}
    return data
