import { Component, Not, Pair, Types, addComponent, addEntity, createWorld, defineComponent, defineRelation, hasComponent, query } from '@bitecs/classic'
import OpenAI from 'openai'
import {describe, test, assert} from 'vitest'
import { createAgent } from '.'

const llm = new OpenAI({
    apiKey: process.env['VITE_OPENAI_API_KEY']
})

const world = createWorld()

const Health = defineComponent({amount: Types.f32})
const Mana = defineComponent({amount: Types.f32})
const OnFire = defineComponent()
const Damaged = defineComponent()
const HasTarget = defineComponent()
const Interactable = defineComponent()
const Quest = defineComponent()
const HasEquippedWeapon = defineComponent()

const ComponentMap: {[key:string]: Component} = {
  Health,
  Mana,
  OnFire,
  Damaged,
  HasTarget,
  Interactable,
  Quest,
  HasEquippedWeapon,
}

const MemberOf = defineRelation()
const AllyOf = defineRelation()
const EnemyOf = defineRelation()
const InterestedIn = defineRelation({ amount: Types.ui8 })

const RelationMap: {[key:string]: Component} = {
  MemberOf,
  AllyOf,
  EnemyOf,
  InterestedIn,
}

const Adventurer = addEntity(world)
const TheBronzeBastion = addEntity(world)
const BlackbannerSyndicate = addEntity(world)

const EntityMap: {[key:string]: number} = {
  Adventurer,
  TheBronzeBastion,
  BlackbannerSyndicate,
}

const agent = createAgent(llm, ComponentMap, RelationMap, EntityMap)

describe('bitECS AI Agent Tests', async () => {
    test('query with components and add new components to the queried entities', async () => {
        for (let i = 0; i < 20; i++) {
            const eid = addEntity(world)
          
            addComponent(world, HasTarget, eid)
            addComponent(world, OnFire, eid)
            addComponent(world, Damaged, eid)
          }
          
          await agent(world, "Find all entities who are damaged, on fire, and have a target, and then make them interactable and give a quest.")
          
          assert(
            query(world, [HasTarget, Damaged, OnFire]).reduce((result, eid) => result && hasComponent(world, Quest, eid) && hasComponent(world, Interactable, eid), true)
          )
    })

    test('query with relations and add new components to the queried entities', async () => {
    
          for (let i = 0; i < 20; i++) {
            const eid = addEntity(world)
          
            addComponent(world, Pair(MemberOf, TheBronzeBastion), eid)
            addComponent(world, HasEquippedWeapon, eid)
          }
          
          await agent(world, "Find all entities that are a member of The Bronze Bastion, not damaged, and have a weapon equipped. Add health component to all of them.")
          assert(
            query(world, [Pair(MemberOf, TheBronzeBastion), Not(Damaged), HasEquippedWeapon]).reduce((result, eid) => result && hasComponent(world, Health, eid), true)
          )
          
    })

    test('query with not-relations and add new components to the queried entities', async () => {

          for (let i = 0; i < 20; i++) {
            const eid = addEntity(world)
          
            addComponent(world, Pair(MemberOf, BlackbannerSyndicate), eid)
            addComponent(world, HasEquippedWeapon, eid)
          }
          await agent(world, "Find all entities that are not a member of The Bronze Bastion and add the Health component to them.")
          assert(
            query(world, [Not(Pair(MemberOf, TheBronzeBastion))]).reduce((result, eid) => result && hasComponent(world, Health, eid), true)
          )
    })
          
    test('query with relations and components, filter the results, and add new components to the filtered entities', async () => {
        for (let i = 0; i < 20; i++) {
            const eid = addEntity(world)
          
            addComponent(world, Pair(MemberOf, TheBronzeBastion), eid)
            addComponent(world, Health, eid)
            Health.amount[eid] = 5
          }
          
          try {
              await agent(world, "Find all entities that are members of The Bronze Bastion, then filter the ones that have less than 10 health and add Quest and Interactable components to them.")
          } catch (e) {
            console.error(e)
            throw e
          }
          assert(
            query(world, [Pair(MemberOf, TheBronzeBastion), Health])
              .filter(eid => Health.amount[eid] < 10)
              .reduce((result,eid) => 
                result && hasComponent(world, Quest, eid) && hasComponent(world, Interactable, eid), 
              true)
          )
    })

    test('query an entity by name, and add new relations to the entity', async () => {
          await agent(world, "Make the Adventurer an enemy of Blackbanner Syndicate and an ally of The Bronze Bastion.")
          assert(
            hasComponent(world, Pair(AllyOf, TheBronzeBastion), Adventurer) && 
            hasComponent(world, Pair(EnemyOf, BlackbannerSyndicate), Adventurer)
          )
    })
})