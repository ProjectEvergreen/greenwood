import { createStore, compose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers';
import { connectRouter } from 'lit-redux-router';
// import _ from 'lodash'; // use es-lodash?
import { pick } from 'lodash-es';

console.debug('From REDUX', createStore, compose, combineReducers);
console.debug('FROM PWA HELPERS', lazyReducerEnhancer);
console.debug('FROM LIT REDUX ROUTER', connectRouter);
// console.debug('FROM LODASH (_.defaults)', _.defaults({ 'a': 1 }, { 'a': 3, 'b': 2 }));
console.debug('FROM LODASH-ES (pick)', pick);

// const store = createStore(reducer, compose(lazyReducerEnhancer(combineReducers)));
// connectRouter(store);