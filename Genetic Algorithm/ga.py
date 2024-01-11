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
    c2 = p1.deepcopy()
    crossSite1 = np.random.randint(0, len(c1.position)/2)
    crossSite2 = np.random.randint(len(c1.position)/2, len(c1.position))

    for i in range(0, len(c1.position)):
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

    if np.random.rand() < 0.5:
        # Add a new schedule
        new_schedule = generate_random_schedule(offspring)
        if new_schedule:
            print("Generated Schedule:", new_schedule)
        else:
            print("No vacant chargers available.")
            if len(offspring.position) >= 7:
                remove_index = np.random.choice(range(0, len(offspring.position), 7))
                del offspring.position[remove_index:remove_index + 7]
        offspring.position.extend(new_schedule)
    else:
        # Remove a random schedule
        if len(offspring.position) >= 7:
            remove_index = np.random.choice(range(0, len(offspring.position), 7))
            del offspring.position[remove_index:remove_index + 7]
    return offspring

def roulette_wheel_selection(p):
    c = np.cumsum(p)
    r = sum(p)*np.random.rand()
    ind = np.argwhere(r <= c)
    return ind[0][0]

def generate_random_schedule(offspring):
    data = initializations.getFunctionInputsDB()
    busses = data["busses"]
    chargers = data["chargers"]
    amperLevels = data["amperLevels"]
    maxPower = data["maxPower"]

    # Randomly choose a bus from the offspring
    bus = random.choice(offspring)

    # Randomly choose a vacant charger
    vacant_chargers = [charger for charger in chargers if charger not in offspring]
    if not vacant_chargers:
        # If no vacant chargers, return None
        return None

    charger = random.choice(vacant_chargers)

    # Randomly choose an amper level
    amperLevel = random.choice(amperLevels)
    ampere = random.uniform(amperLevel["low"], amperLevel["high"])

    # Calculate random start and end times based on bus entry and exit times
    entryTime = [bus["entryTime"] - 1, bus["entryTime"] + 1]  # Allow for some flexibility
    exitTime = [bus["exitTime"] - 1, bus["exitTime"] + 1]  # Allow for some flexibility
    startTime = random.uniform(max(entryTime[0], 0), min(exitTime[0], 24))
    endTime = random.uniform(max(entryTime[1], 0), min(exitTime[1], 24))

    # Calculate price based on ampere, start time, end time, and prices
    price = initialPopulation.calculate_price(ampere, startTime, endTime, data["prices"])

    # Create the new schedule
    new_schedule = [
        charger["chargerCode"], bus["trackCode"],
        startTime, endTime, ampere, price
    ]
    return new_schedule