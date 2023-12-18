import pyodbc
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import cross_val_score, KFold
from sklearn.preprocessing import StandardScaler

server = '192.168.16.3'
database = 'isrproject_test'
username = 'Ayala'
password = 'isr1953'

cnxn = pyodbc.connect('DRIVER={SQL Server};SERVER='+server+';DATABASE='+database+';UID='+username+';PWD='+ password)
cursor = cnxn.cursor()

query = "exec dbo.GetElectricPointChargeDetails '20231001','20231215';"
df = pd.read_sql(query, cnxn)

bus="14:1F:BA:13:8E:F6"
df1 = df.query(f'idtag == "{bus}"')

# Prepare the data
X = df1[['soc']]
y = df1['diffInSec']

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Create MLP model
model = MLPRegressor(hidden_layer_sizes=(100, 50, 25), activation='relu', max_iter=1000, random_state=42)

# Perform 5-fold cross-validation
kf = KFold(n_splits=5, shuffle=True, random_state=42)

# Cross-validate the model
scores = cross_val_score(model, X_scaled, y, cv=kf, scoring='r2')
print(f'R² Scores for 5-fold cross-validation: {scores}')

# Plot the results for the last fold
for train_index, test_index in kf.split(X_scaled):
    X_train, X_test = X_scaled[train_index], X_scaled[test_index]
    y_train, y_test = y.iloc[train_index], y.iloc[test_index]

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    plt.scatter(X_test, y_test, label='Actual Data')
    plt.scatter(X_test, y_pred, color='red', label='Predicted Data')
    plt.xlabel('State of Charge (SOC)')
    plt.ylabel('Difference in Seconds')
    plt.title('Deep MLP Regressor: SOC vs. Difference in Seconds (5-fold CV)')
    plt.legend()
    plt.show()
