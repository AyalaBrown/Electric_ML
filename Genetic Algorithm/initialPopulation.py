import initializations
import random

def init_pop(npop):
    inputs = initializations.getFunctionInputs()
    busses = inputs["busses"]
    prices = inputs["prices"]
    chargers = inputs["chargers"]
    maxAmper = inputs["maxAmper"]
    pop = []
    for i in range(npop):
        sol = []
        for j in range(0, len(busses)):
            if(busses[j]["entryTime"] >0 and busses[j]["exitTime"]>0):
                charger = chargers[random.randint(0, len(chargers)-1)]
                bus = busses[j]
                print(f'entry {bus["entryTime"]},exit {bus["exitTime"]}')
                startTime = random.randint(bus["entryTime"], bus["exitTime"]-1)
                endTime = random.randint(startTime+1, bus["exitTime"])
                amperLevel = random.randint(0, 5)
                price = calculate_price(amperLevel, startTime, endTime, prices)
                print(price)
                sol.append({"chargerCode": charger["chargerCode"], "connectorId": charger["connectorId"], "trackCode": bus["trackCode"], "startTime": startTime, "endTime": endTime, "amperLevel": amperLevel, "price": price})
        pop.append(sol)
    print(pop)
    return pop

def calculate_price(amperLevel, startTime, endTime, prices):
    price = 0
    for k in range(0, len(prices)):
        if startTime >= prices[k]["from"] or price > 0:
            if endTime <= prices[k]["to"]:
                price += prices[k]["finalPriceInAgorot"] * amperLevel * (endTime - startTime)
                return price
            else:
                if price == 0:
                    price = prices[k]["finalPriceInAgorot"] * amperLevel * (prices[k]["to"] - startTime)
                else:
                    price += prices[k]["finalPriceInAgorot"] * amperLevel * (prices[k]["to"] - prices[k]["from"])
    return price


