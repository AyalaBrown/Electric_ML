# # MLPRegression with multiple layers scaled

import pyodbc
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler

server = '192.168.16.3'
database = 'isrproject_test'
username = 'Ayala'
password = 'isr1953'

cnxn = pyodbc.connect('DRIVER={SQL Server};SERVER='+server+';DATABASE='+database+';UID='+username+';PWD='+ password)
cursor = cnxn.cursor()

query = "exec dbo.GetElectricPointChargeDetails '20231001','20231215';"
df = pd.read_sql(query, cnxn)
df1 = df.query('idtag == "14:1F:BA:10:C6:5F"')

# Prepare the data
X = df1[['soc']]
y = df1['diffInSec']

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# # Create and fit a deep MLP Regressor model
# model = MLPRegressor(hidden_layer_sizes=(100, 50, 25), max_iter=1000, random_state=42)
# model.fit(X_train_scaled, y_train)

# # Make predictions on the test set
# y_pred = model.predict(X_test_scaled)

# # Calculate the R² score
# r2_score = model.score(X_test_scaled, y_test)

# # Print the R² score
# print(f'R² Score: {r2_score}')

# # Plot the actual vs predicted values
# plt.scatter(X_test, y_test, label='Actual Data')
# plt.scatter(X_test, y_pred, color='red', label='Predicted Data')
# plt.xlabel('State of Charge (SOC)')
# plt.ylabel('Difference in Seconds')
# plt.title('Deep MLP Regressor: SOC vs. Difference in Seconds')
# plt.legend()
# plt.show()

# # R² Score: 0.3739687995380103

##########################################################################################################################
# #Simple Neural Network (MLP) with One Hidden Layer:

# import pyodbc
# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.neural_network import MLPRegressor
# import matplotlib.pyplot as plt
# from sklearn.preprocessing import StandardScaler

# server = '192.168.16.3'
# database = 'isrproject_test'
# username = 'Ayala'
# password = 'isr1953'

# cnxn = pyodbc.connect('DRIVER={SQL Server};SERVER='+server+';DATABASE='+database+';UID='+username+';PWD='+ password)
# cursor = cnxn.cursor()

# query = "exec dbo.GetElectricPointChargeDetails '20231001','20231215';"
# df = pd.read_sql(query, cnxn)
# df1 = df.query('idtag == "14:1F:BA:10:C6:5F"')

# # Prepare the data
# X = df1[['soc']]
# y = df1['diffInSec']

# # Split the data into training and testing sets
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# scaler = StandardScaler()
# X_train_scaled = scaler.fit_transform(X_train)
# X_test_scaled = scaler.transform(X_test)

# # Create and fit a simple MLP Regressor model with one hidden layer
# model = MLPRegressor(hidden_layer_sizes=(100,), max_iter=1000, random_state=42)
# model.fit(X_train_scaled, y_train)

# # Make predictions on the test set
# y_pred = model.predict(X_test_scaled)

# # Calculate the R² score
# r2_score = model.score(X_test_scaled, y_test)
# print(f'R² Score: {r2_score}')

# # Plot the actual vs predicted values
# plt.scatter(X_test, y_test, label='Actual Data')
# plt.scatter(X_test, y_pred, color='red', label='Predicted Data')
# plt.xlabel('State of Charge (SOC)')
# plt.ylabel('Difference in Seconds')
# plt.title('Simple MLP Regressor: SOC vs. Difference in Seconds')
# plt.legend()
# plt.show()

# # R² Score: -0.8006283493208908

#########################################################################################################

# Neural Network with Different Activation Function Tanh:
# ... (same imports as above)

# Create and fit a deep MLP Regressor model
model = MLPRegressor(hidden_layer_sizes=(100, 50, 25), activation='', max_iter=1000, random_state=42)
model.fit(X_train_scaled, y_train)

# Make predictions on the test set
y_pred = model.predict(X_test_scaled)

# Calculate the R² score
r2_score = model.score(X_test_scaled, y_test)
print(f'R² Score: {r2_score}')

# Plot the actual vs predicted values
plt.scatter(X_test, y_test, label='Actual Data')
plt.scatter(X_test, y_pred, color='red', label='Predicted Data')
plt.xlabel('State of Charge (SOC)')
plt.ylabel('Difference in Seconds')
plt.title('Deep MLP Regressor: SOC vs. Difference in Seconds')
plt.legend()
plt.show()

# tanh: R² Score: -8.556291283035014
# relu: R² Score: 0.3739687995380103
# logistic: R² Score: -10.344258451268683
# identity: R² Score: -0.041813701815304416
# selu: 
#############################################################################################################
