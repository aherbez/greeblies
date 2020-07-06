import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { GreebleModeler } from './modeler';
import { ModelerUI } from './ui/modelerui';

let gm = new GreebleModeler();

let uiBase = document.getElementById('controls');
let ui = new ModelerUI(uiBase, gm);