import { createStore, compose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers';
import { connectRouter } from 'lit-redux-router';
// import _ from 'lodash';  use es-lodash

console.debug('From REDUX', createStore, compose, combineReducers);
console.debug('FROM PWA HELPERS', lazyReducerEnhancer);
console.debug('FROM LIT REDUX ROUTER', connectRouter);

// const store = createStore(reducer, compose(lazyReducerEnhancer(combineReducers)));
// connectRouter(store);