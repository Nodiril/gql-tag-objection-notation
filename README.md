# gql-tag-objection-notation

Convert a graphql-tag object into objection relation notation.

While working on a family tree (graph) application found that querying data from backend depends on what the graphql query is requesting. This tool was developed to allow user to query relations in objection based on the graphql query.

## Install

```
$ npm install gql-tag-objection-notation
```

## Usage

The objection model and schema definition can be found at: https://github.com/Nodiril/family_graph_server

If the graphql query is defined as:
```gql
query Node {
  nodes {
    first_name
    parent_edge {
      id
    }
    partner_edges {
      id
      parent_node_a
      {
        first_name
      }
      children_edges
      {
        child_node
        {
          first_name
          last_name
        }
      }
    }
  }
}
```

In the gql resolver, you need access to the request query. 
```js
const gql = require('graphql-tag');
const getObjectNotation = require("gql-tag-objection-notation");

module.exports = {
  Query: {
    nodes: async (parent, { }, { ctx, models }) => {
      let obj = gql`${ctx.request.body.query}`;

      let selectobj = getObjectNotation(obj.definitions[0].selectionSet.selections[0])
      let nodes = await models.Node.query().modify(selectobj.$modify).where('id', 1)
        .withGraphFetched(getObjectNotation(obj.definitions[0].selectionSet.selections[0]))
      return nodes;
    }
  }
};
```

```js
getObjectNotation.(obj.definitions[0].selectionSet.selections[0])
```
produces the object:
```js
{
    $modify: (builder) => { builder.select(fields.map(a => builder._modelClass.tableName.concat('.', a))) },
    parent_edge: { $modify: (builder) => { builder.select(fields.map(a => builder._modelClass.tableName.concat('.', a))) } },
    partner_edges: {
        $modify: (builder) => { builder.select(fields.map(a => builder._modelClass.tableName.concat('.', a))) }
        parent_node_a: { $modify: (builder) => { builder.select(fields.map(a => builder._modelClass.tableName.concat('.', a))) } },
        children_edges: {
            $modify: (builder) => { builder.select(fields.map(a => builder._modelClass.tableName.concat('.', a))) }
            child_node: { $modify: (builder) => { builder.select(fields.map(a => builder._modelClass.tableName.concat('.', a))) } }
        }
    }
}
```

The modify functions are building the query to select only the fields selected by the graphql query. If there are no fields selected on a given object (not including the joins to other objects), such as in children edges in the example, it will select all fields in the table.

The resulting query returns the data (this data is based on the data in the github example app):

```json
[
    {
        "first_name": "Robert",
        "parent_edge": null,
        "partner_edges": [
            {
                "id": 1,
                "parent_node_a": {
                    "id": 1,
                    "first_name": "Robert"
                },
                "children_edges": [
                    {
                        "id": 2,
                        "graph_id": 1,
                        "node_a": 1,
                        "node_b": 3,
                        "relationship": "pc",
                        "start": null,
                        "end": null,
                        "created_at": "2020-12-19T21:58:33.506Z",
                        "updated_at": "2020-12-19T21:58:33.506Z",
                        "child_node": {
                            "first_name": "Mary",
                            "last_name": "Lincoln"
                        }
                    }
                ]
            }
        ]
    }
]
```

** this does not yet support gql fragments