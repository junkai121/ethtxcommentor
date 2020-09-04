import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import 'styled-components/macro'
import {
  Text,
  Button,
  IdentityBadge,
  EmptyStateCard,
  IconError,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  theme,
  useViewport,
} from '@aragon/ui'
import Web3 from 'web3'

import TagLink from '../Components/TagLink'
import Spinner, { SpinnerWrapper } from '../Components/Spinner'
import { GU, toEther } from '../utils/utils'
import { getInjectedProvider } from '../utils/web3-utils'

const AddressWrapper = styled.div`
  width: 100%;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  .trans-details {
    display: flex;
    justify-content: space-between;
    margin-bottom: ${GU}px;
  }
`

const defaultBlockHeightWindow = 1;
const defaultLoadMoreBlocks = 1;

const Transactions = () => {
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [transactions, setTransactions] = useState([])
  const { above, breakpoints } = useViewport()

  const [lastBlockNumber, setLastBlockNumber] = useState(null)
  const [startBlockNumber, setStartBlockNumber] = useState(null)
  const subscriptionRef = useRef()

  // TODO should fetch latest block at time interval
  // TODO should fetch transactions for block window change event

  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

  const prevStartBlockNumber = usePrevious(startBlockNumber)
  const prevLastBlockNumber = usePrevious(lastBlockNumber)
  

  const fetchRequestedBlocks = useCallback(async () => {
    if (lastBlockNumber) {
      try {
        setLoading(true)
        setFailed(false)
        try {
          const web3 = new Web3(
            getInjectedProvider() || process.env.REACT_APP_INFURA_WS_ENDPOINT
          )
          const fetchSingleBlock = async (id) => {
            let block = await web3.eth.getBlock(id, true)
            const { transactions } = block
            // Filter only ethereum transfers
            const fetchedTransactions = transactions.filter(
                transaction => transaction.value > 0 && transaction.to !== null
            )
            return fetchedTransactions
          }
          let newTransactions = []
          if (!prevStartBlockNumber || !prevLastBlockNumber) {
            for (let id = lastBlockNumber; id >= startBlockNumber; id --) {
              const fetchedTransactions = await fetchSingleBlock(id)
              newTransactions = newTransactions.concat(...fetchedTransactions)
            }
          } else {
            newTransactions = [...transactions]
            console.log("startBlockNumber, prevStartBlockNumber", startBlockNumber, prevStartBlockNumber)
            if (startBlockNumber < prevStartBlockNumber) {
              for (let id = prevStartBlockNumber - 1; id >= startBlockNumber; id --) {
                const fetchedTransactions = await fetchSingleBlock(id)
                newTransactions = newTransactions.concat(...fetchedTransactions)
              }
            }
            console.log("lastBlockNumber, prevLastBlockNumber", lastBlockNumber, prevLastBlockNumber)
            if (lastBlockNumber > prevLastBlockNumber) {
              for (let id = prevLastBlockNumber + 1; id <= lastBlockNumber; id ++) {
                const fetchedTransactions = await fetchSingleBlock(id)
                newTransactions = fetchedTransactions.concat(...newTransactions)
              }
            }
          }
          console.log("newTransactions", newTransactions.length)
          if (transactions.length !== newTransactions.length) {
            setTransactions(newTransactions)
          }
        } catch (error) {
          setFailed(true)
        }
        setLoading(false)
        setFailed(false)
      } catch (error) {
        setFailed(true)
      }
      setLoading(false)
    }
  }, [lastBlockNumber, startBlockNumber, prevLastBlockNumber, prevStartBlockNumber, transactions])

  // Fetch the last block number on the blockchain.
  // note that this may be unstable due to issues with web3.
  const fetchBlockNumber = useCallback(async () => {
    setLoading(true)
    try {
      const web3 = new Web3(
        getInjectedProvider() || process.env.REACT_APP_INFURA_WS_ENDPOINT
      )
      const blockNumber = await web3.eth.getBlockNumber()
      
      setLastBlockNumber(blockNumber)
      setStartBlockNumber(blockNumber - defaultBlockHeightWindow + 1)
    } catch (error) {
      setFailed(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBlockNumber()
  }, [fetchBlockNumber])

  // Effect for running real time updates
  useEffect(() => {
    if (lastBlockNumber && !subscriptionRef.current) {
      try {
        const web3 = new Web3(
          getInjectedProvider() || process.env.REACT_APP_INFURA_WS_ENDPOINT
        )
        const subscription = web3.eth.subscribe(
          'newBlockHeaders',
          async (err, newBlock) => {
            if (err) {
              setFailed(true)
            }
            setLastBlockNumber(newBlock.number)
          }
        )
        subscriptionRef.current = subscription
      } catch (e) {
        setFailed(true)
      }
    }
    // clean up function to avoid open subscriptions on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe((err, result) => {
          if (err) {
            // handle error
            setFailed(true)
          }
        })
      }
    }
  }, [lastBlockNumber])

  useEffect(() => {
    console.log("fetch requested blocks")
    fetchRequestedBlocks()
  }, [lastBlockNumber, startBlockNumber, fetchRequestedBlocks])

  function renderTransactions() {
    if (failed) {
      return (
        <SpinnerWrapper>
          <EmptyStateCard
            actionText="Try Again"
            icon={() => <IconError />}
            text="A problem ocurred while fetching transactions."
            onActivate={() => fetchRequestedBlocks()}
            disabled={loading}
          />
        </SpinnerWrapper>
      )
    }
    return (
      <div>
        <div
          css={`
            margin-bottom: ${GU * 2}px;
          `}
        >
          <Text size="xlarge">
            {`Transactions from block ${startBlockNumber} - latest(${lastBlockNumber})`}
          </Text>
        </div>
        <Table header={
          <TableRow>
            <TableHeader title="Transaction Hash" />
            {above(360) && <TableHeader title="From / To" />}
            {above(breakpoints.small) && <TableHeader title="Value in Eth" />}
          </TableRow>}
        >
        {
          transactions.map(transaction => (
            <TableRow key={transaction.hash}>
              <TableCell>
                <TagLink
                  shorten
                  text={transaction.hash}
                  location={`/transaction/${transaction.hash}`}
                />
              </TableCell>
              {above(360) && (
                <TableCell>
                  <AddressWrapper>
                    <div className="trans-details">
                      <Text
                        smallcaps
                        color={theme.textSecondary}
                        weight="bold"
                        css={`
                          margin-right: ${GU / 2}px;
                        `}
                      >
                        From
                      </Text>{' '}
                      <IdentityBadge
                        shorten
                        entity={transaction.from}
                        fontSize="xxsmall"
                      />
                    </div>
                    <div className="trans-details">
                      <Text
                        smallcaps
                        color={theme.textSecondary}
                        weight="bold"
                        css={`
                          margin-right: ${GU / 2}px;
                        `}
                      >
                        To
                      </Text>{' '}
                      <IdentityBadge
                        shorten
                        entity={transaction.to}
                        fontSize="xxsmall"
                      />
                    </div>
                  </AddressWrapper>
                </TableCell>
              )}
              {above(breakpoints.small) && (
                <TableCell>
                  <Text smallcaps>
                    $ {toEther(transaction.value).toFixed(2)}
                  </Text>
                </TableCell>
              )}
            </TableRow>
          ))
        }
        </Table>
    
        {
          loading? (
            <div style={{ width: '95%' }}>
              <SpinnerWrapper>
                <Spinner />
              </SpinnerWrapper>
            </div>
          ) : (
            <Button
              wide
              mode="strong"
              onClick={() => {
                console.log("loadMore")
                setStartBlockNumber(startBlockNumber - defaultLoadMoreBlocks)
              }}
              css={`
                margin: ${GU}px 0 0 0;
              `}
            >
              Load More
            </Button>
          )
        }
      </div>
    )
  }

  return renderTransactions()
}
export default Transactions