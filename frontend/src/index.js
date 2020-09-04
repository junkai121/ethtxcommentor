import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { AppBar, Main, AppView, Button } from '@aragon/ui'
import { Router } from 'react-router-dom'
import App from './App'
import TabBar from './Components/TabBar'
import { store, history } from './store'
import GlobalErrorBoundary from './Components/GlobalErrorBoundary'

// eslint-disable-next-line react/prop-types
const AragonProvider = ({ children }) => (
  <Main>
    <GlobalErrorBoundary>
      <Provider store={store}>
        <AppView
          appBar={
            <AppBar
              title="Social transactions"
              tabs={<TabBar />}
              endContent={
                <Button.Anchor
                  mode="strong"
                  target="_blank"
                  href="https://github.com/junkai121/social-transactions"
                >
                  See the code
                </Button.Anchor>
              }
            />
          }
        >
          <Router history={history}>{children}</Router>
        </AppView>
      </Provider>
    </GlobalErrorBoundary>
  </Main>
)

const ProvidedApp = () => (
  <AragonProvider>
    <App />
  </AragonProvider>
)

ReactDOM.render(<ProvidedApp />, document.getElementById('root'))