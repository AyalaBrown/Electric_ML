import pyodbc
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from datetime import datetime
from sklearn import linear_model
from sklearn.model_selection import train_test_split

server= '192.168.16.3'
database= 'isrproject_test'
username= 'Ayala'
password= 'isr1953'

cnxn = pyodbc.connect('DRIVER={SQL Server};SERVER='+server+';DATABASE='+database+';UID='+username+';PWD='+ password)
cursor = cnxn.cursor()

query = "exec dbo.GetElectricPointChargeDetails '20231001','20231215';"
df = pd.read_sql(query, cnxn)
print(df.head(5))

X = df.loc[df.idtag=='14:1F:BA:10:C6:5F', ['soc', 'energy']].values
y = df.loc[df.idtag=='14:1F:BA:10:C6:5F', 'diffInSec'].values
lin_model = linear_model.LinearRegression()
lin_model.fit(X, y)
print("R^2: {:.4f}".format(lin_model.score(X, y)))
y_pred = lin_model.predict(X)

plt.scatter(y, y_pred)
plt.show()

# plt.scatter(df1['soc'], df1['diffInSec'], label='Actual Data')
# plt.plot(X['soc'], y_pred, color='red', label='Linear Regression')
# plt.xlabel('State of Charge (SOC)')
# plt.ylabel('Charging Time in Seconds')
# plt.title('Linear Regression: SOC vs. Charging Time in Seconds')
# plt.legend()
# plt.show()




