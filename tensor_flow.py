import os
import pyodbc
import pandas as pd
import tensorflow as tf
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

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

# Standardize the features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Create a neural network model with 'elu' activation
model = Sequential()
model.add(Dense(100, input_dim=X_train_scaled.shape[1], activation='selu'))
model.add(Dense(50, activation='selu'))
model.add(Dense(25, activation='selu'))
model.add(Dense(1))

# Compile the model
model.compile(loss='mean_squared_error', optimizer='adam')

# Fit the model
model.fit(X_train_scaled, y_train, epochs=100, batch_size=32, validation_data=(X_test_scaled, y_test), verbose=1)

# Evaluate the model
score = model.evaluate(X_test_scaled, y_test, verbose=0)
print(f'Mean Squared Error: {score}')

# Make predictions on the test set
y_pred = model.predict(X_test_scaled)

# Plot the actual vs predicted values
plt.scatter(X_test, y_test, label='Actual Data')
plt.scatter(X_test, y_pred, color='red', label='Predicted Data')
plt.xlabel('State of Charge (SOC)')
plt.ylabel('Difference in Seconds')
plt.title('Neural Network with ELU Activation: SOC vs. Difference in Seconds')
plt.legend()
plt.show()


#relu: Mean Squared Error: 1674.078125
#elu: Mean Squared Error: 1351.9329833984375
#selu: Mean Squared Error: 1300.4849853515625