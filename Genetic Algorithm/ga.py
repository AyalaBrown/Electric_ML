import numpy as np
from ypstruct import structure
import convertions
import initializations
import random
import initialPopulation

def run(problem, params):
    # Problem Information
    costfunc = problem.costfunc
    nvar = problem.nvar
    varmin = problem.varmin
    varmax = problem.varmax
    
    # Parameters
    maxit = params.maxit
    npop = params.npop
    beta = params.beta
    pc = params.pc
    nc = int(np.round(pc*npop/2)*2)
    gamma = params.gamma
    mu = params.mu
    sigma = params.sigma
    
    # Empty Individual Template
    empty_individual = structure()
    empty_individual.position = None
    empty_individual.cost = None
    empty_individual.iteration = None

    # BestSolution Ever Found
    bestsol = empty_individual.deepcopy()
    bestsol.cost = np.inf

    init_pop = convertions.initial_population()

    # Initialize Population
    pop = empty_individual.repeat(npop)
    for i in range(0, npop):
        pop[i].position = init_pop[i]
        pop[i].cost = costfunc(pop[i].position)
        if pop[i].cost < bestsol.cost:
            bestsol = pop[i].deepcopy()
            bestsol.iteration = 0

    # Best Cost Of Iteration
    bestcost = np.empty(maxit)    

    # Main Loop
    for it in range(0, maxit):

        costs = np.array([x.cost for x in pop])
        avg_cost = np.mean(costs)
        if avg_cost != 0:
            costs = costs/avg_cost
        probs = np.exp(-beta*costs)    

        popc = []
        for _ in range(nc//2):

            # Perform Roulette Wheel Selection
            p1 = pop[roulette_wheel_selection(probs)]
            p2 = pop[roulette_wheel_selection(probs)]

            # Perform Crossover
            c1, c2 = crossover(p1, p2, gamma)

            # Perform Mutation
            c1 = mutate(c1)
            c2 = mutate(c2)

            # print(f"c1: {c1.position}, c2: {c2.position}")

            # Evaluate First Offspring
            c1.cost = costfunc(c1.position)
            if c1.cost < bestsol.cost:
                bestsol = c1.deepcopy()
                bestsol.iteration = it

            # Evaluate Second Offspring
            c2.cost = costfunc(c2.position)
            if c2.cost < bestsol.cost:
                bestsol = c2.deepcopy()
                bestsol.iteration = it

            # Add Offspring to popc
            popc.append(c1)
            popc.append(c2)   

        # Merge, Sort and Select
        pop += popc
        pop = sorted(pop, key=lambda x: x.cost)
        pop = pop[0:npop]

        # Store Best Cost
        bestcost[it] = bestsol.cost

        # Show Iteration Information
        print("Iteration {}: Best Cost = {}".format(it, bestcost[it]))

    # Output
    out = structure()
    out.pop = pop
    out.bestsol = bestsol
    out.bestcost = bestcost
    return out

def crossover(p1, p2, gamma=0.1):
    c1 = p1.deepcopy()
    c2 = p2.deepcopy()
    length = min(len(p1.position), len(p2.position))

    crossSite1 = np.random.randint(0, length/2)
    crossSite2 = np.random.randint(length/2, length)

    for i in range(0, length):

        if i >=crossSite1 and i <= crossSite2:
            c1.position[i] = p2.position[i]
            c2.position[i] = p1.position[i]
        else:
            c1.position[i] = p1.position[i]
            c2.position[i] = p2.position[i]
    # print(f"p1: {p1.position}, p2: {p2.position}")
    # print(f"c1: {c1.position}, c2: {c2.position}")
    return c1, c2

def mutate(x):
    offspring = x.deepcopy()
    values = initializations.getFunctionInputsDB()["values"]
    random_gene_idx = np.random.choice(range(len(offspring.position)))
    param_inx = random_gene_idx % 7
    param_values = values[param_inx]
    if param_values is not None:
        offspring.position[random_gene_idx] = int(random.choice(param_values))
    else:
        offspring.position[random_gene_idx] += int(np.round(np.random.random()))
        # Add a new schedule
    offspring.position = add_or_remove_schedule(offspring.position)
    #     if new_schedule:
    #         print("Generated Schedule:", new_schedule)
    #     else:
    #         print("No vacant chargers available.")
    #         if len(offspring.position) >= 7:
    #             remove_index = np.random.choice(range(0, len(offspring.position), 7))
    #             del offspring.position[remove_index:remove_index + 7]
    #     offspring.position.extend(new_schedule)
    # else:
    #     # Remove a random schedule
    #     if len(offspring.position) >= 7:
    #         remove_index = np.random.choice(range(0, len(offspring.position), 7))
    #         del offspring.position[remove_index:remove_index + 7]
    return offspring

def roulette_wheel_selection(p):
    c = np.cumsum(p)
    r = sum(p)*np.random.rand()
    ind = np.argwhere(r <= c)
    return ind[0][0]

def add_or_remove_schedule(offspring):
    data = initializations.getFunctionInputsDB()
    busses = data["busses"]
    chargers = data["chargers"]
    amperLevels = data["amperLevels"]
    maxPower = data["maxPower"]
    capacity = data["capacity"]
    busses_charge = {}
    chargers_busy = {}
    bus_busy = []

    for bus in busses:
        busses_charge[bus['trackCode']] = {'charge': 0,'entryTime':bus['entryTime'],'exitTime':bus['exitTime'],'soc_start': bus['socStart'], 'soc_end': bus['socEnd']}

    for i in range(0, len(offspring), 7):
        chargerCode, connectorId, bus_code, start_time, end_time, ampere, price = offspring[i:i+7] 
        voltage = 0
        for charger in chargers:
            if charger['chargerCode'] == chargerCode:
                voltage = charger["voltage"]
                break
        if bus_code not in busses_charge:
            raise Exception("Bus code not found")
        charging_time = end_time - start_time
        if bus_code in capacity:
            busses_charge[bus_code]['charge']+= charging_time/1000/60*ampere*voltage/1000/capacity[int(bus_code)]
            if busses_charge[bus_code]['charge'] > 95:
                del offspring[i:i+7]
                return offspring
    for bus in busses_charge:
        if busses_charge[bus]['charge'] < busses_charge[bus]['soc_end']:
            for i in range(0, len(offspring), 7):
                chargerCode, connectorId, bus_code, start_time, end_time, ampere, price = offspring[i:i+7] 
                if (chargerCode, connectorId) in chargers_busy:
                    chargers_busy[(chargerCode, connectorId)].append({"from": start_time, "to": end_time})
                else:
                    chargers_busy[(chargerCode, connectorId)] = [{"from": start_time, "to": end_time}]
                if bus_code == bus:
                    bus_busy.append({"from": start_time, "to": end_time})

            chargerCode 
            connectorId
            start_time
            end_time
            voltage
            # random ampere
            ampereLevel = random.choice(amperLevels)

            # founding the biggest slot of time
            ampere = ampereLevel["low"]+(ampereLevel["low"]+ampereLevel["high"])/2
            prev_empty_time = structure()
            prev_empty_time.start = 0
            prev_empty_time.end = busses_charge[bus]["entryTime"]

            big_empty_time = 0
            
            bus_busy.sort(key=lambda x: x["from"])
            for busy in bus_busy:
                time = busy["from"] - prev_empty_time.end
                prev_empty_time.start = busy["to"]
                prev_empty_time.end = busy["from"]
                if time > big_empty_time:
                    big_empty_time = time
                    start_time = prev_empty_time.start
                    end_time = prev_empty_time.end
            time = busses_charge[bus]["exitTime"] - prev_empty_time.end
            prev_empty_time.start = prev_empty_time.end
            prev_empty_time.end = busses_charge[bus]["exitTime"]
            if time > big_empty_time:
                big_empty_time = time
                start_time = prev_empty_time.start
                end_time = prev_empty_time.end

            # founding a free charger at the free time
            
            for charger in chargers_busy:
                chargers_busy[charger].sort(key=lambda x: x["from"])
                prev = chargers_busy[charger][0]
                for time in chargers_busy[charger]:
                    if time["from"]>prev["to"]and time["to"]<prev["from"]:
                        chargerCode, connectorId = charger
                        break
            for charger in chargers:
                if charger["chargerCode"] == chargerCode:
                    voltage = charger["voltage"]
                    break
            # calculating the price of the schedule        
            price = initialPopulation.calculate_price(ampere, start_time, end_time, data["prices"], voltage) 
            offspring.extend([chargerCode, connectorId, bus, start_time, end_time, ampere, price])
    return offspring
