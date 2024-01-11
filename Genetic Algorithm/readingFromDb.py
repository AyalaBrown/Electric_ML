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
    b = pd.read_sql(query, cnxn).to_dict(orient='records')
    busses = []
    for i in b:
        if i["socStart"] > 0 and i["socStart"] < i["socEnd"] and i["entryTime"] < i["exitTime"]and i["entryTime"] > 0:
            busses.append(i)
    query = "exec isrProject_test.dbo.GetChargersList;"
    chrgs = []
    # chargers = pd.read_sql(query, cnxn).to_dict(orient='records')
    # for i in range(0, len(chargers)):
    #     if chargers[i]["voltage"] > 0:
    #         chrgs.append({"chargerCode": chargers[i]["code"], "connectorId": 1, "voltage": chargers[i]["voltage"]})
    #         chrgs.append({"chargerCode": chargers[i]["code"], "connectorId": 2, "voltage": chargers[i]["voltage"]})
    for i in range(100):
        chrgs.append({"chargerCode": i, "connectorId": 1, "voltage": 650})
        chrgs.append({"chargerCode": i, "connectorId": 2, "voltage": 650})
    query = "exec dbo.GetElectricRate_PerDate '20240107';"
    prices = pd.read_sql(query, cnxn).to_dict(orient='records')
    query = "exec dbo.GetElectricRate_PerDate '20240108';"
    prices2 = pd.read_sql(query, cnxn).to_dict(orient='records')
    prices.extend(prices2)
    query = "exec dbo.GetElectricAmperLevels;"
    amperLevels = pd.read_sql(query, cnxn).to_dict(orient='records')
    query = "exec  dbo.GetElectricCapacity;"
    c = pd.read_sql(query, cnxn)
    capacity = {}
    for i in range(0, len(c)):
        capacity[int(c.loc[i,"trackCode"])] = float(c.loc[i,"capacity"])
    data = {"busses": busses, "maxPower": 4000000, "chargers": chrgs, "prices": prices, "amperLevels": amperLevels, "capacity": capacity}
    return data
