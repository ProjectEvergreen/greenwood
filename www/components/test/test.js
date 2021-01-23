// import _ from 'lodash';  use es-lodash

import { createStore, compose, combineReducers } from 'redux';
// import { reducer } from './reducer';
import { lazyReducerEnhancer } from 'pwa-helpers';
// import { connectRouter } from 'lit-redux-router';

// const store = createStore(reducer, compose(lazyReducerEnhancer(combineReducers)));

// connectRouter(store);

console.debug(createStore, compose, combineReducers);
console.debug(lazyReducerEnhancer);