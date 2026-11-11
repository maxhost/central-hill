# Source allowlist

Only the following sources/docs are delivered. No env, credentials, sessions, populated fixture JSON, results, build/cache, root provisioning or protection scripts are included. Identity guards remain exact.

| File                             | SHA256                                                           |
| -------------------------------- | ---------------------------------------------------------------- |
| README.md                        | 2fb410e4756af402e4cd6a2baef0009220f318e549761e4b92a662528598ae74 |
| SUMMARY.md                       | 7d57b10a8c8b35a7e51b8e3df7a47fd0fcd6014281d59ecb0614de1e45293ade |
| apply-manifest-policy.mjs        | 8268342460e2fd486747696b36aee4423e87ff171be3a8d0141838c3e7444507 |
| create-test-admin.mjs            | 0c2ec12a03840e8697133a12f12ead5ad41bfb89ce2fa6b279f311c434dd1e6d |
| entity-runner.mjs                | 58f30fdb3cd6e7ac58ab7b13d9fb4f6933f3fed3c8f1fc3180ff7ff8fd69daca |
| extend-gallery.mjs               | aa78a3880cc03e5e6968e4c556a3e023299bbc3978ecff94e18df84c045b6548 |
| final-rollup.mjs                 | d7d46c8cc493f6afc95f305650b7aeb7780faf1cbf31ccba4d2eb42793c40ce2 |
| hidden-field-audit.mjs           | f66dabc1d54b9d0d79a81fb7a331aad2f536b95057add72dbecc8c50dc1154ba |
| inventory-pages.mjs              | d136b58a96b2b1ecedac59aff5ba5539a571f86d552713da9ddb1947482ffe63 |
| marker-loader.mjs                | 05cc135432d469a13b47b45e5bd4d5ab58aac7a9dc2ede76a3ffbecff54366cf |
| page-runner.mjs                  | d3b5a16f866be8634313c7903a5319b3befb3d93764a2f30123662fd6e5dc80d |
| q0-browser-observe.mjs           | a485075016e0001f4a6097e03c2c7da3e970f6a8d9097a382cbf77f23ec76331 |
| q1-routes-service.mjs            | 7d9293c98412047245a93ffc7a8d8fef052a48fc8f505187d6552b255ceb6389 |
| q2-about-fr-blank.mjs            | c9a75978486fd9d800d12b0e150bc28687beacdf62c7824f1fe57a57344992f6 |
| q2-guide-pt.mjs                  | e9eea6b89c1ce065a9e171ddd8a1160ec095a84bff998baf07e232c43009c287 |
| q2-nested-alt-retest.mjs         | e7989899c10a18a834ccc9a8d50ca6398f18094556ed86f7c460e024cb3c4e1d |
| q2-ui-absence.mjs                | 1d273f04463f5ba60abff52e08e8da0f35d75a541d2a74c7ac18f02950446ce1 |
| q3-snapshot.mjs                  | fdf18bf300e53d63bba0b485a67a657d708a4e18c6e101486b46314b4fdb4e1a |
| q6-compatibility.mjs             | f9770fa295cb950b8637622ff487e51dea95bca298b01f8cbf69117983fc94d1 |
| q6-conservation.mjs              | 74b69c4b55f878b5ba59036c14cf42cae8199a4aef074c0e9cc5471992a425f0 |
| q6-inherit-ui.mjs                | b1fc4ff3f9360f7890d81d4d0066a21d9af8fe07482d321a58e1cf7664467c29 |
| q6-legacy-readers.mjs            | 62286cb87c5da94473a605f42f710b9cc27282d8e4edaa034079654224d9a6a1 |
| q6-mobile.mjs                    | bedd7ac44e5f711f4784307cd21052e533ab6179a19d8a753a0dafeac1acab6f |
| qa-common.mjs                    | 3c3aef91b269fc28e8b3d6a767569b4c56aaaf11021a50fbc59833d1f0fa6c8a |
| register.mjs                     | 31a34caa266363a1b7e1b06eb6f5a337f1d4cc8ef8aa8a43f3db706bfbe256d6 |
| resolve-manifest.mjs             | 3ef17357f501837dd61a5ec3612bb2afd0a63fac013bca1bdbf635f6bf4d3b6b |
| runtime.cjs                      | d60be3b744fb72cffbde462b6ead47fd093e52442b4488f55ca7b1eb3962ad61 |
| schema-preflight.mjs             | 52228effa705b92140a7176e1689b09fc025ec584e9f71b1c36f69a05475c968 |
| scoreboard.mjs                   | bb81f8577722bbbeabcdd0eed97eaf141280183ebb0c82452af4a1296f3bc0d5 |
| seed.mjs                         | 5d667e731df5ae7d90c4a5f75ccd942cfb81ae80f4af3b74f655d2b3812019cf |
| supporting-service.mjs           | 7110f0437a770354566b6882820545c4cca7110e77b24ac3f4721f2eb818b651 |
| variant-guides-empty.mjs         | 500349634d9cf79f1279caa366a56f6e871f80c5cdbf7e175d368831c4155228 |
| variant-popular.mjs              | acc1d22b8e5985fa222fb7c5300057484e1ab050cb1774976f535ff8f71607dd |
| variant-secondary-cta.mjs        | f3705053f88f0127e35b3b7349a316d6a30cecf43e32cd9044b8d00e2218e729 |
| variant-service-conditionals.mjs | dba35c0efe259ea2abad480894ac4111a4e5d4c3b0502996243cc3030f9c6e98 |

Four MTS→MJS conversions: inventory-pages, seed, create-test-admin, q6-conservation. TypeScript transpile only; no bundling/minification. All sources formatted with Prettier3.8.4. Node22 --check passed for every MJS/CJS. Scoped ESLint is owned by the orchestrator after copy inside the repository.
