import initializations
import random
inputs = initializations.getFunctionInputsDB()
busses = inputs["busses"]
prices = inputs["prices"]
chargers = inputs["chargers"]
maxPower = inputs["maxPower"]
amperLevels = inputs["amperLevels"]

def init_pop(npop):
    pop = []
    for i in range(npop):
        sol = []
        for j in range(0, len(busses)):
            if(busses[j]["entryTime"] >0 and busses[j]["exitTime"]>0):
                charger = chargers[random.randint(0, len(chargers)-1)]
                bus = busses[j]
                startTime = random.randint(bus["entryTime"], bus["exitTime"]-1)
                endTime = random.randint(startTime+1, bus["exitTime"])
                amperLevel = random.randint(1, 5)
                ampere = amperLevels[amperLevel-1]["low"]+(amperLevels[amperLevel-1]["high"]-amperLevels[amperLevel-1]["low"])/2
                price = calculate_price(ampere, startTime, endTime, prices, charger["voltage"])
                sol.append({"chargerCode": charger["chargerCode"], "connectorId": charger["connectorId"], "trackCode": bus["trackCode"], "startTime": startTime, "endTime": endTime, "ampere": ampere, "price": price})
        pop.append(sol)
    return pop

def calculate_price(ampere, startTime, endTime, prices, voltage):
    sorted_prices = sorted(prices, key=lambda x: x["from"])
    price = 0
    for k in range(0, len(prices)):
        if (startTime >= sorted_prices[k]["from"] and startTime<prices[k]["to"]) or price > 0:
            if endTime <= sorted_prices[k]["to"]:
                price += sorted_prices[k]["finalPriceInAgorot"]/100 * ampere * (endTime/1000./60./60. - startTime/1000./60./60.) * voltage/1000
                return price
            else:
                if price == 0:
                    price = sorted_prices[k]["finalPriceInAgorot"]/100 * ampere * (sorted_prices[k]["to"]/1000./60./60. - startTime/1000./60./60.) * voltage/1000
                else:
                    price += sorted_prices[k]["finalPriceInAgorot"]/100 * ampere * (sorted_prices[k]["to"]/1000./60./60. - sorted_prices[k]["from"]/1000./60./60.) *voltage/1000
    return price