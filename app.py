import pyodbc
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler

server = '192.168.16.3'
database = 'electric_ML'
username = 'Ayala'
password = 'isr1953'

cnxn = pyodbc.connect('DRIVER={SQL Server};SERVER='+server+';DATABASE='+database+';UID='+username+';PWD='+ password)
cursor = cnxn.cursor()

query = "exec dbo.GetElectricPointChargeDetails '20230101','20231230';"
df = pd.read_sql(query, cnxn)

bus="14:1F:BA:13:8E:F6" #
# bus = "00:B0:52:FF:FF:02" #permenent rate
# bus= "14:1F:BA:10:7D:9E" #permenet rate
# bus="14:1F:BA:10:C6:94" #permenent rate
# bus="9C:F6:DD:91:8D:78" #permenent rate

df1 = df.query(f'idtag == "{bus}"')

X = df1[['soc']]
y = df1['accDiff']/60

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = MLPRegressor(hidden_layer_sizes=(100, 50, 25), activation='relu', max_iter=1000, random_state=42)
model.fit(X_train_scaled, y_train)

y_pred = model.predict(X_test_scaled)

r2_score = model.score(X_test_scaled, y_test)
print(f'R² Score: {r2_score}')

print(f'x train: {X_train.shape}')
print(f'x test: {X_test.shape}')

plt.xticks(range(int(X_test.min()-X_test.min()%5), int(X_test.max()) + 1, 5))
plt.yticks(range(int(y_test.min()-y_test.min()%10), int(y_test.max()) + 1, 10))

plt.scatter(X, y, label='Actual Data')
plt.scatter(X_test, y_pred, color='red', label='Predicted Data')
plt.xlabel('State of Charge (SOC)')
plt.ylabel('Time in Seconds')
plt.title(f'Bus: {bus},   R² Score: {r2_score} ')
plt.legend()
plt.show()

print(df1['epcRowId'].nunique())
print(df1['epcRowId'].unique())

charges = df1['epcRowId'].unique()

for i in charges:
    charge_data = df1[df1['epcRowId'] == i]  # Boolean indexing to get rows for the current charge
    plt.scatter(charge_data['soc'], charge_data['accDiff']/60, label=f'Charge: {i}')
    plt.scatter(X_test, y_pred, color='red', label='Predicted Data')
    plt.xlabel('State of Charge (SOC)')
    plt.ylabel('Time in Seconds')
    plt.title(f'Bus: {bus},   R² Score: {r2_score} ')
    plt.legend()
    plt.show()