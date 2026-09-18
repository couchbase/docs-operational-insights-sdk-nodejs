// tag::server-async[]
/*
 *  Copyright 2016-2026. Couchbase, Inc.
 *  All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// tag::server-async[]
import {
    Credential,
    createInstance,
    QueryHandle,
    QueryResultHandle,
    QueryStatus,
  } from 'couchbase-analytics'

  async function waitForQueryResults(
    handle: QueryHandle,
    delayMs: number = 2500,
    timeoutMs: number = 120000
  ): Promise<QueryResultHandle> {
    const deadline = Date.now() + timeoutMs
    let status: QueryStatus | null = null
    while (true) {
      try {
        status = await handle.fetchStatus()
        if (status.resultsReady()) {
          return status.resultsHandle()
        }
      } catch (e) {
        console.log(`Error fetching query status: ${e}`)
      }

      const now = Date.now()
      if (deadline < now + delayMs) {
        throw new Error(
          `Query results not ready within ${timeoutMs / 1000} seconds.`
        )
      }

      if (status !== null) {
        console.log(`Query status: ${status}`)
      }
      console.log(
        `Query results not ready yet, sleeping for ${delayMs / 1000} seconds...`
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  async function main(): Promise<void> {
    // Update this to your cluster
    // IMPORTANT:  The appropriate port needs to be specified. The SDK's default ports are 80 (http) and 443 (https).
    //             If attempting to connect to Capella, the correct ports are most likely to be 8095 (http) and 18095 (https).
    //             Capella example: https://cb.2xg3vwszqgqcrsix.cloud.couchbase.com:18095
    const clusterConnStr = 'https://--your-instance--'
    const username = 'Administrator'
    const password = 'password'
    // User Input ends here.

    const credential = new Credential(username, password)
    const cluster = createInstance(clusterConnStr, credential)
    const statement = 'SELECT VALUE SLEEP("x", 100) FROM RANGE(1, 100) AS id;'
    const handle = await cluster.startQuery(statement)

    const resultHandle = await waitForQueryResults(handle, 2500, 60000)
    const res = await resultHandle.fetchResults()

    for await (const row of res.rows()) {
      console.log('Found row: ', row)
    }
    console.log('Metadata: ', res.metadata())
    await resultHandle.discardResults()
  }

  main()
    .then(() => {
      console.log('Finished.  Exiting app...')
    })
    .catch((err) => {
      console.log('ERR: ', err)
      console.log('Exiting app...')
      process.exit(1)
    })
// end::server-async[]
