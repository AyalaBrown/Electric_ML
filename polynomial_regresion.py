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

df['Soc_Squer'] = df['soc']**2
# 'idtag == "14:1F:BA:10:C6:5F"'

# # Prepare the data
# X = df1['soc'].values.reshape(-1, 1)
# y = df1['diffInSec']

# # Create and fit a linear regression model
# model = LinearRegression()
# model.fit(X, y)

# Create X with all values between 0 and 100
X2 = df.loc[df.idtag=='14:1F:BA:10:C6:5F', ['soc', 'Soc_Squer']].values
y = df.loc[df.idtag=='14:1F:BA:10:C6:5F', 'diffInSec'].values
# Create and fit a linear regression model
lin_model = linear_model.LinearRegression()
lin_model.fit(X2, y)
print("R^2: {:.4f}".format(lin_model.score(X2, y)))

# def adjusted_r_square(model, X, y):
#     coefficient = (X.shape[0]-1) / (X.shape[0]-X.shape[1]-1)
#     return (1 - (1-model.score(X, y)) * coefficient)

# print(f'Adjusted R^2={adjusted_r_square(lin_model, X2, y)}')

# plt.figure(figsize=(5, 5))
# plt.plot(range(100), y, '.k')
# plt.plot(range(100), lin_model.predict(X2))
# plt.xlabel('soc')
# plt.ylabel('time')
# plt.title('bus: 14:1F:BA:10:C6:5F')
# plt.legend()
# plt.show()

plt.figure(figsize=(5, 5))
plt.plot(y, '.k', label='Actual Data')
plt.plot(lin_model.predict(X2), '.r', label='Linear Regression Prediction')
plt.xlabel('Data Point Index')
plt.ylabel('Time')
plt.title('bus: 14:1F:BA:10:C6:5F')
plt.legend()
plt.show()



