import { Credential, createInstance } from "couchbase-analytics"

async function main() {
    const clusterConnStr = 'https://--your-instance--'
    const username = 'username'
    const password = 'Password123!'

    const credential = new Credential(username, password)
    const cluster = createInstance(clusterConnStr, credential, {
        securityOptions: {
            disableServerCertificateVerification: true
        }
    })

{
    // #tag::sqlpp_scope_query[]
    const scope = cluster.database('travel-sample').scope('inventory')

    let qs =
        `
        SELECT airline, COUNT(*) AS route_count, AVG(route.distance) AS avg_route_distance
        FROM route
        GROUP BY airline
        ORDER BY route_count DESC
        `

    let res = await scope.executeQuery(qs)

    for await (let row of res.rows()) {
        console.log(row)
    }

    console.log('Metadata: ', res.metadata())
//     // #end::sqlpp_scope_query[]
}
{
    // #tag::sqlpp_cluster_query[]
    let qs =
        `
        SELECT r.airline, COUNT(*) AS route_count, AVG(r.distance) AS avg_route_distance
        FROM \`travel-sample\`.\`inventory\`.\`route\` AS r
        GROUP BY r.airline
        ORDER BY route_count DESC
        `

    let res = await cluster.executeQuery(qs)
//     // #end::sqlpp_cluster_query[]
}
{
    // #tag::sqlpp_positional_parameters_query[]
    const scope = cluster.database('travel-sample').scope('inventory')

    let qs =
        `
        SELECT airline, COUNT(*) AS route_count, AVG(route.distance) AS avg_route_distance
        FROM route
        WHERE sourceairport = $1 AND distance >= $2
        GROUP BY airline
        ORDER BY route_count DESC
        `

    let res = await scope.executeQuery(qs, {
        positionalParameters: ['SFO', 1000],
    })
    // #end::sqlpp_positional_parameters_query[]
}

{
    // #tag::sqlpp_named_parameters_query[]
    const scope = cluster.database('travel-sample').scope('inventory')

    let qs =
        `
        SELECT airline, COUNT(*) AS route_count, AVG(route.distance) AS avg_route_distance
        FROM route
        WHERE sourceairport = $sourceAirport AND distance >= $distance
        GROUP BY airline
        ORDER BY route_count DESC
        `

    let res = await scope.executeQuery(qs, {
        namedParameters: {sourceAirport: 'SFO', distance: 1000}
    })
    // #end::sqlpp_named_parameters_query[]
}
}

main()
    .catch((err) => {
        console.log('ERR:', err)
        process.exit(1)
    })
    .then(
        process.exit)