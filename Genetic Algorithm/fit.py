import numpy as np
import initializations
import convertions

def fitness(solution):
    try:
        parameters = initializations.getFunctionInputsDB()
        busses = parameters["busses"]
        chargers = parameters["chargers"]
        maxPower = parameters["maxPower"]
        capacity = parameters["capacity"]

        # constraints
        # constraint 1 - A bus is scheduled to charge while it is in the parking lot
        # constraint 2 - There are not conflicts between busses and chargers
        # constraint 3 - The the total consumption of the ampere in the parking lot not exceeds the max ampere 
        # constraint 4 - A bus charging enough for it's tasks

        # weights:
        # constraint 1
        w1 = 0.28
        # constraint 2
        w2 = 0.28
        # constraint 3 
        w3 = 0.30
        # constraint 4
        w4 = 0.28

        total_cost = 0

        # parameters:
        # constraint 1
        cost1 = 0
        good1 = 0
        not_good1 = 0
        # constraint 2
        cost2 = 0
        good2 = 0
        not_good2 = 0
        # constraint 3 
        start_ampere_list = []
        end_ampere_list = []
        cost3 = 0
        # constraint 4
        busses_charge = {}
        cost4 = 0

        for bus in busses:
            busses_charge[bus['trackCode']] = 0

        for i in range(0, len(solution), 7):
            
            chargerCode, connectorId, bus_code, start_time, end_time, ampere, price = solution[i:i+7] 
            voltage = 0
            for charger in chargers:
                if charger['chargerCode'] == chargerCode:
                    voltage = charger["voltage"]
                    break
            
            # constraint 1
            if start_time > end_time:
                not_good1+=1
            else:
                for bus in busses:
                    if bus["trackCode"] == bus_code:
                        start = bus["entryTime"]
                        end = bus["exitTime"]
                        if start <= start_time and end_time <= end:
                            good1+=1
                        else:
                            not_good1+=1

            # constraint 2 
            for j in range(i+7, len(solution), 7):
                chargerCode2, connectorId2, bus_code2, start_time2, end_time2, _, _ = solution[j:j+7] 
                if bus_code == bus_code2 and start_time <= end_time2 and end_time >= start_time2:
                    not_good2+=1
                else:
                    good2+=1
                if chargerCode == chargerCode2 and connectorId == connectorId2 and start_time <= end_time2 and end_time >= start_time2:
                    not_good2+=1
                else:
                    good2+=1

            # constraint 3
            start_ampere_list.append({'start_time': start_time, 'ampere': ampere, 'voltage': voltage})
            end_ampere_list.append({'end_time': end_time, 'ampere': ampere, 'voltage': voltage})

            # constraint 4
            if bus_code not in busses_charge:
                raise Exception("Bus code not found")
            charging_time = end_time - start_time
            busses_charge[bus_code]+= charging_time*ampere*voltage/1000/capacity[int(bus_code)]
            print(ampere*voltage/1000/capacity[int(bus_code)])

        cost1 = w1*not_good1/(good1+not_good1)
        cost2 = w2*not_good2/(good2+not_good2)
        cost3 = w3*calculate_cost_3(start_ampere_list, end_ampere_list, maxPower)
        total_cost = cost1 + cost2 + cost3

        return total_cost
    except Exception as e:
        print(e)
        return

def calculate_cost_3(start_ampere_list, end_ampere_list, maxPower):
    total_power = 0 
    good = 0
    not_good = 0
    merged_list = start_ampere_list + end_ampere_list

    def custom_key(item):
        if 'start_time' in item:
            return item['start_time']
        elif 'end_time' in item:
            return item['end_time']
        else:
            return float('inf')
        
    sorted_merged_list = sorted(merged_list, key=custom_key)

    for i in range(0, len(sorted_merged_list)):
        if 'start_time' in sorted_merged_list[i]:
            total_power += sorted_merged_list[i]['ampere']*sorted_merged_list[i]['voltage']
            if total_power > maxPower:
                not_good+=1
            else:
                good+=1
        else: 
            total_power -= sorted_merged_list[i]['ampere']*sorted_merged_list[i]['voltage']
    return not_good/(good+not_good)
