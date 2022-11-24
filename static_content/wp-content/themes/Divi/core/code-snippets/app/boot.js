// External Dependencies
import React from 'react';
import { render } from 'react-dom';
import $ from 'jquery';
import App from 'cerebral';
import Devtools from 'cerebral/devtools';
import { Container } from '@cerebral/react';
import {
  assign,
  clone,
  set,
  get,
} from 'lodash';

// Internal Dependencies
import store from './store/';
import CodeSnippetsApp from './components/App';
import { STATE_IDLE } from '@code-snippets/lib/constants';


const initialState = {
  content:              '',
  context:              'code_css',
  importError:          false,
  items:                [],
  showLibrary:          false,
  showPortability:      false,
  importState:          STATE_IDLE,
};

$(window).on('et_code_snippets_container_ready', (event, preferences, container = document) => {
  let devtools = null;

  if (process.env.NODE_ENV === 'development') {
    devtools = Devtools({
      host:                 '127.0.0.1:4045',
      reconnect:            true,
      bigComponentsWarning: 15,
    });
  }

  const context   = preferences.context;
  const state     = assign(clone(initialState), {});
  const modalType = preferences.modalType;

  if ('' !== context) {
    set(state, 'context', context);
  }

  const content = get(preferences, 'content', '');
  if ('' !== content) {
    set(state, 'content', content);
  }

  const selectedContent = get(preferences, 'selectedContent', '');
  set(state, 'selectedContent', selectedContent);

  const sidebarLabel = get(preferences, 'sidebarLabel', '');
  set(state, 'sidebarLabel', sidebarLabel);

  const app = App(store(state), {
    devtools,
    returnSequencePromise: true,
  });

  const containerId = preferences.containerId;

  render(
    <Container app={app}>
      <CodeSnippetsApp
        modalType={modalType}
        codeMirrorId={preferences.codeMirrorId}
        insertCodeCallback={preferences.insertCodeCallback}
        container={container}
      />
    </Container>,
    container.getElementById(containerId)
  );

  // Disable main body scrolling.
  $(container).find('body.et-admin-page').addClass('et-code-snippets-open');
});

$(window).on('et_code_snippets_library_close', () => {
  // In EPanel, the DOMNode is available w/ the `window`.
  $('#et-code-snippets-container').remove();
  $('body.et-admin-page').removeClass('et-code-snippets-open');

  // In VB, the DOMNode is available w/ the IFrame's parent window.
  window.parent.jQuery('#et-code-snippets-container').remove();
});
