import { createStore, compose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers';
// import { connectRouter } from 'lit-redux-router';
// import _ from 'lodash';  use es-lodash

console.debug(createStore, compose, combineReducers);
console.debug(lazyReducerEnhancer);

// const store = createStore(reducer, compose(lazyReducerEnhancer(combineReducers)));
// connectRouter(store);