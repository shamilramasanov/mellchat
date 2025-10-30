2025-10-29T23:08:49.637853919Z [inf]  
2025-10-29T23:08:51.976652545Z [inf]  [35m[Region: europe-west4][0m
2025-10-29T23:08:51.983428513Z [inf]  [35m==============
2025-10-29T23:08:51.983456537Z [inf]  Using Nixpacks
2025-10-29T23:08:51.983461681Z [inf]  ==============
2025-10-29T23:08:51.983466171Z [inf]  [0m
2025-10-29T23:08:51.983576237Z [inf]  context: 49rx-STYc
2025-10-29T23:08:52.144657369Z [inf]  ╔══════════════════════════════ Nixpacks v1.38.0 ══════════════════════════════╗
2025-10-29T23:08:52.144702953Z [inf]  ║ setup      │ nodejs_22, npm-9_x                                              ║
2025-10-29T23:08:52.144710068Z [inf]  ║──────────────────────────────────────────────────────────────────────────────║
2025-10-29T23:08:52.144714855Z [inf]  ║ install    │ npm ci                                                          ║
2025-10-29T23:08:52.144721639Z [inf]  ║──────────────────────────────────────────────────────────────────────────────║
2025-10-29T23:08:52.144726131Z [inf]  ║ build      │ npm run build                                                   ║
2025-10-29T23:08:52.144730913Z [inf]  ║──────────────────────────────────────────────────────────────────────────────║
2025-10-29T23:08:52.144735512Z [inf]  ║ start      │ cd backend/api-gateway && npm install && npm run start:with-    ║
2025-10-29T23:08:52.144740006Z [inf]  ║            │ migrations                                                      ║
2025-10-29T23:08:52.144745023Z [inf]  ╚══════════════════════════════════════════════════════════════════════════════╝
2025-10-29T23:08:52.396256242Z [inf]  [internal] load build definition from Dockerfile
2025-10-29T23:08:52.396300033Z [inf]  [internal] load build definition from Dockerfile
2025-10-29T23:08:52.397602675Z [inf]  [internal] load build definition from Dockerfile
2025-10-29T23:08:52.397637687Z [inf]  [internal] load build definition from Dockerfile
2025-10-29T23:08:52.406843620Z [inf]  [internal] load build definition from Dockerfile
2025-10-29T23:08:52.409445817Z [inf]  [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1745885067
2025-10-29T23:08:52.689067241Z [inf]  [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1745885067
2025-10-29T23:08:52.689386624Z [inf]  [internal] load .dockerignore
2025-10-29T23:08:52.689422684Z [inf]  [internal] load .dockerignore
2025-10-29T23:08:52.689786297Z [inf]  [internal] load .dockerignore
2025-10-29T23:08:52.699045549Z [inf]  [internal] load .dockerignore
2025-10-29T23:08:52.712539451Z [inf]  [stage-0 10/10] COPY . /app
2025-10-29T23:08:52.712588161Z [inf]  [stage-0  9/10] RUN printf '\nPATH=/app/node_modules/.bin:$PATH' >> /root/.profile
2025-10-29T23:08:52.712600290Z [inf]  [stage-0  8/10] RUN --mount=type=cache,id=s/fba6175b-59bc-4bbb-8d1a-ead414b441f5-node_modules/cache,target=/app/node_modules/.cache npm run build
2025-10-29T23:08:52.712628526Z [inf]  [stage-0  7/10] COPY . /app/.
2025-10-29T23:08:52.712651102Z [inf]  [stage-0  6/10] RUN --mount=type=cache,id=s/fba6175b-59bc-4bbb-8d1a-ead414b441f5-/root/npm,target=/root/.npm npm ci
2025-10-29T23:08:52.712660150Z [inf]  [stage-0  5/10] COPY . /app/.
2025-10-29T23:08:52.712670589Z [inf]  [stage-0  4/10] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
2025-10-29T23:08:52.712679994Z [inf]  [stage-0  3/10] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
2025-10-29T23:08:52.712713337Z [inf]  [internal] load build context
2025-10-29T23:08:52.712721654Z [inf]  [stage-0  2/10] WORKDIR /app/
2025-10-29T23:08:52.712729644Z [inf]  [stage-0  1/10] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067@sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de
2025-10-29T23:08:52.712751001Z [inf]  [stage-0  1/10] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067@sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de
2025-10-29T23:08:52.712764903Z [inf]  [internal] load build context
2025-10-29T23:08:52.713060359Z [inf]  [internal] load build context
2025-10-29T23:08:52.719936878Z [inf]  [stage-0  1/10] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067@sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de
2025-10-29T23:08:52.787167901Z [inf]  [internal] load build context
2025-10-29T23:08:52.791827865Z [inf]  [stage-0  2/10] WORKDIR /app/
2025-10-29T23:08:52.791873777Z [inf]  [stage-0  3/10] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
2025-10-29T23:08:52.805780311Z [inf]  [stage-0  3/10] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
2025-10-29T23:08:52.807475605Z [inf]  [stage-0  4/10] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
2025-10-29T23:08:52.997386948Z [inf]  unpacking 'https://github.com/NixOS/nixpkgs/archive/ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.tar.gz' into the Git cache...

2025-10-29T23:09:23.074200166Z [inf]  unpacking 'https://github.com/railwayapp/nix-npm-overlay/archive/main.tar.gz' into the Git cache...

2025-10-29T23:09:23.585890347Z [inf]  installing 'ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env'

2025-10-29T23:09:24.582255381Z [inf]  these 5 derivations will be built:
  /nix/store/6vy68gykpxfphbmmyd59ya88xvrwvvaa-npm-9.9.4.tgz.drv
  /nix/store/kmkgqwwal88b9lch9dl53iqa3wsm6vdb-libraries.drv
  /nix/store/91aaayacr12psqb9fmp8arg1xafgg9v2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv
  /nix/store/w9h0z1lhfwxc0m38f3w5brfdqrzm4wyj-npm.drv
  /nix/store/wiwjap8vj633jl044zc5q9kjkmdqdvp0-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv

2025-10-29T23:09:24.582273264Z [inf]  these 85 paths will be fetched (123.96 MiB download, 589.99 MiB unpacked):

2025-10-29T23:09:24.582312876Z [inf]    /nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2
  /nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2
  /nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37
  /nix/store/j7p46r8v9gcpbxx89pbqlh61zhd33gzv-binutils-2.43.1
  /nix/store/df2a8k58k00f2dh2x930dg6xs6g6mliv-binutils-2.43.1-lib
  /nix/store/srcmmqi8kxjfygd0hyy42c8hv6cws83b-binutils-wrapper-2.43.1
  /nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl
  /nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8

2025-10-29T23:09:24.582322978Z [inf]    /nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin
  /nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5
  /nix/store/pkc7mb4a4qvyz73srkqh4mwl70w98dsv-curl-8.11.0
  /nix/store/p123cq20klajcl9hj8jnkjip5nw6awhz-curl-8.11.0-bin
  /nix/store/5f5linrxzhhb3mrclkwdpm9bd8ygldna-curl-8.11.0-dev
  /nix/store/agvks3qmzja0yj54szi3vja6vx3cwkkw-curl-8.11.0-man
  /nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10
  /nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2

2025-10-29T23:09:24.582329527Z [inf]    /nix/store/qbry6090vlr9ar33kdmmbq2p5apzbga8-expand-response-params
  /nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46
  /nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0
  /nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1

2025-10-29T23:09:24.582358808Z [inf]    /nix/store/l89iqc7am6i60y8vk507zwrzxf0wcd3v-gcc-14-20241116
  /nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib
  /nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc
  /nix/store/xcn9p4xxfbvlkpah7pwchpav4ab9d135-gcc-wrapper-14-20241116
  /nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36
  /nix/store/1c6bmxrrhm8bd26ai2rjqld2yyjrxhds-glibc-2.40-36-bin
  /nix/store/kj8hbqx4ds9qm9mq7hyikxyfwwg13kzj-glibc-2.40-36-dev
  /nix/store/kryrg7ds05iwcmy81amavk8w13y4lxbs-gmp-6.3.0

2025-10-29T23:09:24.582368028Z [inf]    /nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0
  /nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01
  /nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11
  /nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1
  /nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9

2025-10-29T23:09:24.582392215Z [inf]    /nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35
  /nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13
  /nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2
  /nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev
  /nix/store/xmbv8s4p4i4dbxgkgdrdfb0ym25wh6gk-isl-0.20
  /nix/store/2wh1gqyzf5xsvxpdz2k0bxiz583wwq29-keyutils-1.6.3-lib
  /nix/store/milph81dilrh96isyivh5n50agpx39k2-krb5-1.21.3
  /nix/store/b56mswksrql15knpb1bnhv3ysif340kd-krb5-1.21.3-dev

2025-10-29T23:09:24.582412173Z [inf]    /nix/store/v9c1s50x7magpiqgycxxkn36avzbcg0g-krb5-1.21.3-lib

2025-10-29T23:09:24.582416178Z [inf]    /nix/store/nlqind4szw3amcmhgy4pd2n0894558gg-libX11-1.8.10
  /nix/store/hjbxiwsc587b8dc6v6pisa34aj10hq23-libXau-1.0.11
  /nix/store/c9gk656q2x8av467r06hcjag31drjfzh-libXdmcp-1.1.5
  /nix/store/r87iqz07igmwfvb12mgr6rmpb6353ys4-libXext-1.3.6
  /nix/store/5mb70vg3kdzkyn0zqdgm4f87mdi0yi4i-libglvnd-1.7.0
  /nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7
  /nix/store/2a3anh8vl3fcgk0fvaravlimrqawawza-libmpc-1.3.1
  /nix/store/8675pnfr4fqnwv4pzjl67hdwls4q13aa-libssh2-1.11.1
  /nix/store/d7zhcrcc7q3yfbm3qkqpgc3daq82spwi-libssh2-1.11.1-dev
  /nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3

2025-10-29T23:09:24.582423423Z [inf]    /nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2
  /nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev
  /nix/store/2j3c18398phz5c1376x2qvva8gx9g551-libxcb-1.17.0

2025-10-29T23:09:24.582453324Z [inf]    /nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36
  /nix/store/pc74azbkr19rkd5bjalq2xwx86cj3cga-linux-headers-6.12
  /nix/store/fv7gpnvg922frkh81w5hkdhpz0nw3iiz-mirrors-list
  /nix/store/qs22aazzrdd4dnjf9vffl0n31hvls43h-mpfr-4.2.1
  /nix/store/grixvx878884hy8x3xs0c0s1i00j632k-nghttp2-1.64.0
  /nix/store/dz97fw51rm5bl9kz1vg0haj1j1a7r1mr-nghttp2-1.64.0-dev
  /nix/store/qcghigzrz56vczwlzg9c02vbs6zr9jkz-nghttp2-1.64.0-lib
  /nix/store/fkyp1bm5gll9adnfcj92snyym524mdrj-nodejs-22.11.0
  /nix/store/9l9n7a0v4aibcz0sgd0crs209an9p7dz-openssl-3.3.2

2025-10-29T23:09:24.582460193Z [inf]    /nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2
  /nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin
  /nix/store/qq5q0alyzywdazhmybi7m69akz0ppk05-openssl-3.3.2-bin
  /nix/store/kqm7wpqkzc4bwjlzqizcbz0mgkj06a9x-openssl-3.3.2-dev

2025-10-29T23:09:24.582465754Z [inf]    /nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev
  /nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6
  /nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0
  /nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44

2025-10-29T23:09:24.582470266Z [inf]    /nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0

2025-10-29T23:09:24.582473263Z [inf]    /nix/store/dj96qp9vps02l3n8xgc2vallqa9rhafb-sqlite-3.47.0

2025-10-29T23:09:24.582476961Z [inf]    /nix/store/yc39wvfz87i0bl8r6vnhq48n6clbx2pb-sqlite-3.47.0-bin
  /nix/store/i47d0rzbbnihcxkcaj48jgii5pj58djc-sqlite-3.47.0-dev

2025-10-29T23:09:24.582480264Z [inf]    /nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux
  /nix/store/d0gfdcag8bxzvg7ww4s7px4lf8sxisyx-stdenv-linux

2025-10-29T23:09:24.582529016Z [inf]    /nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook
  /nix/store/2phvd8h14vwls0da1kmsxc73vzmhkm3b-util-linux-minimal-2.39.4-lib
  /nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc
  /nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3
  /nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin
  /nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1
  /nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev

2025-10-29T23:09:24.589350137Z [inf]  copying path '/nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.59347673Z [inf]  copying path '/nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc' from 'https://cache.nixos.org'...
copying path '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.593940593Z [inf]  copying path '/nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.594183775Z [inf]  copying path '/nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.597635935Z [inf]  copying path '/nix/store/pc74azbkr19rkd5bjalq2xwx86cj3cga-linux-headers-6.12' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.597679786Z [inf]  copying path '/nix/store/fv7gpnvg922frkh81w5hkdhpz0nw3iiz-mirrors-list' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.598085341Z [inf]  copying path '/nix/store/agvks3qmzja0yj54szi3vja6vx3cwkkw-curl-8.11.0-man' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.599313509Z [inf]  copying path '/nix/store/grixvx878884hy8x3xs0c0s1i00j632k-nghttp2-1.64.0' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.603030683Z [inf]  copying path '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.953932573Z [inf]  copying path '/nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7' from 'https://cache.nixos.org'...

2025-10-29T23:09:24.972076559Z [inf]  copying path '/nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.285598544Z [inf]  copying path '/nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2' from 'https://cache.nixos.org'...
copying path '/nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.285618577Z [inf]  copying path '/nix/store/qbry6090vlr9ar33kdmmbq2p5apzbga8-expand-response-params' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.285661588Z [inf]  copying path '/nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.285680717Z [inf]  copying path '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.286152174Z [inf]  copying path '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.286244635Z [inf]  copying path '/nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib' from 'https://cache.nixos.org'...
copying path '/nix/store/1c6bmxrrhm8bd26ai2rjqld2yyjrxhds-glibc-2.40-36-bin' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.286363953Z [inf]  copying path '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1' from 'https://cache.nixos.org'...
copying path '/nix/store/kryrg7ds05iwcmy81amavk8w13y4lxbs-gmp-6.3.0' from 'https://cache.nixos.org'...
copying path '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.286441918Z [inf]  copying path '/nix/store/2wh1gqyzf5xsvxpdz2k0bxiz583wwq29-keyutils-1.6.3-lib' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.287220212Z [inf]  copying path '/nix/store/hjbxiwsc587b8dc6v6pisa34aj10hq23-libXau-1.0.11' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.28730038Z [inf]  copying path '/nix/store/c9gk656q2x8av467r06hcjag31drjfzh-libXdmcp-1.1.5' from 'https://cache.nixos.org'...
copying path '/nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.287331003Z [inf]  copying path '/nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.32162406Z [inf]  copying path '/nix/store/qcghigzrz56vczwlzg9c02vbs6zr9jkz-nghttp2-1.64.0-lib' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.32247108Z [inf]  copying path '/nix/store/9l9n7a0v4aibcz0sgd0crs209an9p7dz-openssl-3.3.2' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.322575343Z [inf]  copying path '/nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.323865812Z [inf]  copying path '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.327154266Z [inf]  copying path '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.327827452Z [inf]  copying path '/nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.330996527Z [inf]  copying path '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.332949303Z [inf]  copying path '/nix/store/2j3c18398phz5c1376x2qvva8gx9g551-libxcb-1.17.0' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.333522594Z [inf]  copying path '/nix/store/2phvd8h14vwls0da1kmsxc73vzmhkm3b-util-linux-minimal-2.39.4-lib' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.333814292Z [inf]  copying path '/nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.334701757Z [inf]  copying path '/nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.339693186Z [inf]  copying path '/nix/store/dz97fw51rm5bl9kz1vg0haj1j1a7r1mr-nghttp2-1.64.0-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.341159416Z [inf]  copying path '/nix/store/xmbv8s4p4i4dbxgkgdrdfb0ym25wh6gk-isl-0.20' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.341354582Z [inf]  copying path '/nix/store/qs22aazzrdd4dnjf9vffl0n31hvls43h-mpfr-4.2.1' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.342515379Z [inf]  copying path '/nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.347272083Z [inf]  copying path '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.359834405Z [inf]  copying path '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.360207654Z [inf]  copying path '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46' from 'https://cache.nixos.org'...
copying path '/nix/store/df2a8k58k00f2dh2x930dg6xs6g6mliv-binutils-2.43.1-lib' from 'https://cache.nixos.org'...
copying path '/nix/store/dj96qp9vps02l3n8xgc2vallqa9rhafb-sqlite-3.47.0' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.371082854Z [inf]  copying path '/nix/store/yc39wvfz87i0bl8r6vnhq48n6clbx2pb-sqlite-3.47.0-bin' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.371579643Z [inf]  copying path '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.375942707Z [inf]  copying path '/nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.376252951Z [inf]  copying path '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.37957947Z [inf]  copying path '/nix/store/2a3anh8vl3fcgk0fvaravlimrqawawza-libmpc-1.3.1' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.381610576Z [inf]  copying path '/nix/store/kj8hbqx4ds9qm9mq7hyikxyfwwg13kzj-glibc-2.40-36-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.387256415Z [inf]  copying path '/nix/store/nlqind4szw3amcmhgy4pd2n0894558gg-libX11-1.8.10' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.444377533Z [inf]  copying path '/nix/store/i47d0rzbbnihcxkcaj48jgii5pj58djc-sqlite-3.47.0-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.466250596Z [inf]  copying path '/nix/store/r87iqz07igmwfvb12mgr6rmpb6353ys4-libXext-1.3.6' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.474526463Z [inf]  copying path '/nix/store/5mb70vg3kdzkyn0zqdgm4f87mdi0yi4i-libglvnd-1.7.0' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.484190974Z [inf]  copying path '/nix/store/v9c1s50x7magpiqgycxxkn36avzbcg0g-krb5-1.21.3-lib' from 'https://cache.nixos.org'...
copying path '/nix/store/8675pnfr4fqnwv4pzjl67hdwls4q13aa-libssh2-1.11.1' from 'https://cache.nixos.org'...
copying path '/nix/store/qq5q0alyzywdazhmybi7m69akz0ppk05-openssl-3.3.2-bin' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.490392637Z [inf]  copying path '/nix/store/j7p46r8v9gcpbxx89pbqlh61zhd33gzv-binutils-2.43.1' from 'https://cache.nixos.org'...
copying path '/nix/store/l89iqc7am6i60y8vk507zwrzxf0wcd3v-gcc-14-20241116' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.490439196Z [inf]  copying path '/nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.490521139Z [inf]  copying path '/nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2' from 'https://cache.nixos.org'...
copying path '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.500470793Z [inf]  copying path '/nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.517194852Z [inf]  copying path '/nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.531588845Z [inf]  copying path '/nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.548629703Z [inf]  copying path '/nix/store/kqm7wpqkzc4bwjlzqizcbz0mgkj06a9x-openssl-3.3.2-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.553741767Z [inf]  copying path '/nix/store/pkc7mb4a4qvyz73srkqh4mwl70w98dsv-curl-8.11.0' from 'https://cache.nixos.org'...
copying path '/nix/store/milph81dilrh96isyivh5n50agpx39k2-krb5-1.21.3' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.570428115Z [inf]  copying path '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10' from 'https://cache.nixos.org'...
copying path '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0' from 'https://cache.nixos.org'...
copying path '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.591725569Z [inf]  copying path '/nix/store/b56mswksrql15knpb1bnhv3ysif340kd-krb5-1.21.3-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.593364984Z [inf]  copying path '/nix/store/p123cq20klajcl9hj8jnkjip5nw6awhz-curl-8.11.0-bin' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.61807579Z [inf]  copying path '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.658240247Z [inf]  building '/nix/store/kmkgqwwal88b9lch9dl53iqa3wsm6vdb-libraries.drv'...

2025-10-29T23:09:26.659544205Z [inf]  copying path '/nix/store/d7zhcrcc7q3yfbm3qkqpgc3daq82spwi-libssh2-1.11.1-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:26.815576658Z [inf]  building '/nix/store/91aaayacr12psqb9fmp8arg1xafgg9v2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...

2025-10-29T23:09:27.017033711Z [inf]  copying path '/nix/store/srcmmqi8kxjfygd0hyy42c8hv6cws83b-binutils-wrapper-2.43.1' from 'https://cache.nixos.org'...

2025-10-29T23:09:28.45161367Z [inf]  copying path '/nix/store/5f5linrxzhhb3mrclkwdpm9bd8ygldna-curl-8.11.0-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:28.498710739Z [inf]  building '/nix/store/6vy68gykpxfphbmmyd59ya88xvrwvvaa-npm-9.9.4.tgz.drv'...

2025-10-29T23:09:28.659820823Z [inf]  
trying https://registry.npmjs.org/npm/-/npm-9.9.4.tgz

2025-10-29T23:09:28.664094114Z [inf]    % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed

2025-10-29T23:09:28.737027961Z [inf]  100 2648k  100 2648k    0     0  35.4M      0 --:--:-- --:--:-- --:--:-- 35.9M

2025-10-29T23:09:28.785351084Z [inf]  copying path '/nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev' from 'https://cache.nixos.org'...

2025-10-29T23:09:28.88783651Z [inf]  copying path '/nix/store/fkyp1bm5gll9adnfcj92snyym524mdrj-nodejs-22.11.0' from 'https://cache.nixos.org'...

2025-10-29T23:09:31.646754726Z [inf]  copying path '/nix/store/xcn9p4xxfbvlkpah7pwchpav4ab9d135-gcc-wrapper-14-20241116' from 'https://cache.nixos.org'...

2025-10-29T23:09:31.657954386Z [inf]  copying path '/nix/store/d0gfdcag8bxzvg7ww4s7px4lf8sxisyx-stdenv-linux' from 'https://cache.nixos.org'...

2025-10-29T23:09:31.695379249Z [inf]  building '/nix/store/w9h0z1lhfwxc0m38f3w5brfdqrzm4wyj-npm.drv'...

2025-10-29T23:09:31.756631617Z [inf]  Running phase: unpackPhase

2025-10-29T23:09:31.761542912Z [inf]  unpacking source archive /nix/store/fkd1ma3nify8r9wp463yg5rqz9hdcyf1-npm-9.9.4.tgz

2025-10-29T23:09:31.86818415Z [inf]  source root is package

2025-10-29T23:09:31.918785198Z [inf]  setting SOURCE_DATE_EPOCH to timestamp 499162500 of file package/package.json

2025-10-29T23:09:31.923971305Z [inf]  Running phase: installPhase

2025-10-29T23:09:32.592778335Z [inf]  building '/nix/store/wiwjap8vj633jl044zc5q9kjkmdqdvp0-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...

2025-10-29T23:09:32.670116307Z [inf]  created 33 symlinks in user environment

2025-10-29T23:09:32.830926348Z [inf]  building '/nix/store/yqimqn0gi7q8n7ji71biaaz5n9l6fni7-user-environment.drv'...

2025-10-29T23:09:33.011742821Z [inf]  removing old generations of profile /nix/var/nix/profiles/per-user/root/channels

2025-10-29T23:09:33.012309911Z [inf]  removing old generations of profile /nix/var/nix/profiles/per-user/root/profile

2025-10-29T23:09:33.012419751Z [inf]  removing profile version 1

2025-10-29T23:09:33.012605064Z [inf]  removing old generations of profile /nix/var/nix/profiles/per-user/root/channels

2025-10-29T23:09:33.012690839Z [inf]  removing old generations of profile /nix/var/nix/profiles/per-user/root/profile

2025-10-29T23:09:33.015219882Z [inf]  finding garbage collector roots...

2025-10-29T23:09:33.015559524Z [inf]  removing stale link from '/nix/var/nix/gcroots/auto/lzjbmb2ry0z7lma2fvpqprb12921pnb5' to '/nix/var/nix/profiles/per-user/root/profile-1-link'

2025-10-29T23:09:33.020346258Z [inf]  deleting garbage...

2025-10-29T23:09:33.023870409Z [inf]  deleting '/nix/store/a9qf4wwhympzs35ncp80r185j6a21w07-user-environment'

2025-10-29T23:09:33.02460832Z [inf]  deleting '/nix/store/253kwn1730vnay87xkjgxa2v97w3y079-user-environment.drv'

2025-10-29T23:09:33.025151602Z [inf]  deleting '/nix/store/hn5mrh362n52x8wwab9s1v6bgn4n5c94-env-manifest.nix'

2025-10-29T23:09:33.043249098Z [inf]  deleting '/nix/store/d0gfdcag8bxzvg7ww4s7px4lf8sxisyx-stdenv-linux'

2025-10-29T23:09:33.043482986Z [inf]  deleting '/nix/store/xcn9p4xxfbvlkpah7pwchpav4ab9d135-gcc-wrapper-14-20241116'

2025-10-29T23:09:33.044232047Z [inf]  deleting '/nix/store/srcmmqi8kxjfygd0hyy42c8hv6cws83b-binutils-wrapper-2.43.1'

2025-10-29T23:09:33.044911218Z [inf]  deleting '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux'

2025-10-29T23:09:33.045114616Z [inf]  deleting '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0'

2025-10-29T23:09:33.047630051Z [inf]  deleting '/nix/store/5f5linrxzhhb3mrclkwdpm9bd8ygldna-curl-8.11.0-dev'

2025-10-29T23:09:33.048212219Z [inf]  deleting '/nix/store/b56mswksrql15knpb1bnhv3ysif340kd-krb5-1.21.3-dev'

2025-10-29T23:09:33.049055257Z [inf]  deleting '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11'

2025-10-29T23:09:33.05156409Z [inf]  deleting '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10'

2025-10-29T23:09:33.053719937Z [inf]  deleting '/nix/store/j7p46r8v9gcpbxx89pbqlh61zhd33gzv-binutils-2.43.1'

2025-10-29T23:09:33.057368663Z [inf]  deleting '/nix/store/df2a8k58k00f2dh2x930dg6xs6g6mliv-binutils-2.43.1-lib'

2025-10-29T23:09:33.058057754Z [inf]  deleting '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0'

2025-10-29T23:09:33.078834377Z [inf]  deleting '/nix/store/p123cq20klajcl9hj8jnkjip5nw6awhz-curl-8.11.0-bin'

2025-10-29T23:09:33.079184879Z [inf]  deleting '/nix/store/l89iqc7am6i60y8vk507zwrzxf0wcd3v-gcc-14-20241116'

2025-10-29T23:09:33.095354095Z [inf]  deleting '/nix/store/kj8hbqx4ds9qm9mq7hyikxyfwwg13kzj-glibc-2.40-36-dev'

2025-10-29T23:09:33.099881415Z [inf]  deleting '/nix/store/1c6bmxrrhm8bd26ai2rjqld2yyjrxhds-glibc-2.40-36-bin'

2025-10-29T23:09:33.100523049Z [inf]  deleting '/nix/store/pkc7mb4a4qvyz73srkqh4mwl70w98dsv-curl-8.11.0'

2025-10-29T23:09:33.100749003Z [inf]  deleting '/nix/store/dz97fw51rm5bl9kz1vg0haj1j1a7r1mr-nghttp2-1.64.0-dev'

2025-10-29T23:09:33.101149596Z [inf]  deleting '/nix/store/qcghigzrz56vczwlzg9c02vbs6zr9jkz-nghttp2-1.64.0-lib'

2025-10-29T23:09:33.101388997Z [inf]  deleting '/nix/store/fv7gpnvg922frkh81w5hkdhpz0nw3iiz-mirrors-list'

2025-10-29T23:09:33.101656114Z [inf]  deleting '/nix/store/milph81dilrh96isyivh5n50agpx39k2-krb5-1.21.3'

2025-10-29T23:09:33.102559762Z [inf]  deleting '/nix/store/v9c1s50x7magpiqgycxxkn36avzbcg0g-krb5-1.21.3-lib'

2025-10-29T23:09:33.1035399Z [inf]  deleting '/nix/store/pc74azbkr19rkd5bjalq2xwx86cj3cga-linux-headers-6.12'

2025-10-29T23:09:33.112516942Z [inf]  deleting '/nix/store/xmbv8s4p4i4dbxgkgdrdfb0ym25wh6gk-isl-0.20'

2025-10-29T23:09:33.113342409Z [inf]  deleting '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6'

2025-10-29T23:09:33.113695404Z [inf]  deleting '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9'

2025-10-29T23:09:33.11591151Z [inf]  deleting '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin'

2025-10-29T23:09:33.116824607Z [inf]  deleting '/nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36'

2025-10-29T23:09:33.117205525Z [inf]  deleting '/nix/store/2a3anh8vl3fcgk0fvaravlimrqawawza-libmpc-1.3.1'

2025-10-29T23:09:33.117463622Z [inf]  deleting '/nix/store/qs22aazzrdd4dnjf9vffl0n31hvls43h-mpfr-4.2.1'

2025-10-29T23:09:33.117652354Z [inf]  deleting '/nix/store/grixvx878884hy8x3xs0c0s1i00j632k-nghttp2-1.64.0'

2025-10-29T23:09:33.117900311Z [inf]  deleting '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin'

2025-10-29T23:09:33.118380847Z [inf]  deleting '/nix/store/d7zhcrcc7q3yfbm3qkqpgc3daq82spwi-libssh2-1.11.1-dev'

2025-10-29T23:09:33.118683567Z [inf]  deleting '/nix/store/kqm7wpqkzc4bwjlzqizcbz0mgkj06a9x-openssl-3.3.2-dev'

2025-10-29T23:09:33.120202848Z [inf]  deleting '/nix/store/2wh1gqyzf5xsvxpdz2k0bxiz583wwq29-keyutils-1.6.3-lib'

2025-10-29T23:09:33.120470196Z [inf]  deleting '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook'

2025-10-29T23:09:33.120601336Z [inf]  deleting '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01'

2025-10-29T23:09:33.120862483Z [inf]  deleting '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0'

2025-10-29T23:09:33.121295112Z [inf]  deleting '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13'

2025-10-29T23:09:33.121713498Z [inf]  deleting '/nix/store/fkd1ma3nify8r9wp463yg5rqz9hdcyf1-npm-9.9.4.tgz'

2025-10-29T23:09:33.121967652Z [inf]  deleting '/nix/store/8675pnfr4fqnwv4pzjl67hdwls4q13aa-libssh2-1.11.1'

2025-10-29T23:09:33.122215947Z [inf]  deleting '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44'

2025-10-29T23:09:33.122533437Z [inf]  deleting '/nix/store/1m82cbxhdbb85h3lykjpry4mnvyq5x0m-libraries'

2025-10-29T23:09:33.123199708Z [inf]  deleting '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2'

2025-10-29T23:09:33.123590624Z [inf]  deleting '/nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3'

2025-10-29T23:09:33.124953531Z [inf]  deleting '/nix/store/agvks3qmzja0yj54szi3vja6vx3cwkkw-curl-8.11.0-man'

2025-10-29T23:09:33.125451213Z [inf]  deleting '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46'

2025-10-29T23:09:33.125790543Z [inf]  deleting '/nix/store/lwi59jcfwk2lnrakmm1y5vw85hj3n1bi-source'

2025-10-29T23:09:34.172615218Z [inf]  deleting '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1'

2025-10-29T23:09:34.174327817Z [inf]  deleting '/nix/store/qbry6090vlr9ar33kdmmbq2p5apzbga8-expand-response-params'

2025-10-29T23:09:34.174550982Z [inf]  deleting '/nix/store/kryrg7ds05iwcmy81amavk8w13y4lxbs-gmp-6.3.0'

2025-10-29T23:09:34.174800275Z [inf]  deleting '/nix/store/qq5q0alyzywdazhmybi7m69akz0ppk05-openssl-3.3.2-bin'

2025-10-29T23:09:34.175073656Z [inf]  deleting '/nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8'

2025-10-29T23:09:34.175281047Z [inf]  deleting '/nix/store/9l9n7a0v4aibcz0sgd0crs209an9p7dz-openssl-3.3.2'

2025-10-29T23:09:34.175671653Z [inf]  deleting '/nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl'

2025-10-29T23:09:34.175805893Z [inf]  deleting '/nix/store/rqsx4vk32ga32b6yxzhifpx9j2xcn6q6-source'

2025-10-29T23:09:34.176687417Z [inf]  deleting '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1'

2025-10-29T23:09:34.178638041Z [inf]  deleting '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35'

2025-10-29T23:09:34.180936212Z [inf]  deleting unused links...

2025-10-29T23:09:35.741867873Z [inf]  note: currently hard linking saves 2.97 MiB

2025-10-29T23:09:35.786417554Z [inf]  61 store paths deleted, 559.38 MiB freed

2025-10-29T23:09:35.904382896Z [inf]  [stage-0  4/10] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
2025-10-29T23:09:35.906861263Z [inf]  [stage-0  5/10] COPY . /app/.
2025-10-29T23:09:36.035141249Z [inf]  [stage-0  5/10] COPY . /app/.
2025-10-29T23:09:36.036356334Z [inf]  [stage-0  6/10] RUN --mount=type=cache,id=s/fba6175b-59bc-4bbb-8d1a-ead414b441f5-/root/npm,target=/root/.npm npm ci
2025-10-29T23:09:36.210307908Z [inf]  npm warn config production Use `--omit=dev` instead.

2025-10-29T23:09:39.571802499Z [inf]  npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead

2025-10-29T23:09:52.205810776Z [inf]  
added 550 packages, and audited 552 packages in 16s

2025-10-29T23:09:52.205830384Z [inf]  
134 packages are looking for funding

2025-10-29T23:09:52.205881851Z [inf]    run `npm fund` for details

2025-10-29T23:09:52.215419206Z [inf]  
3 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.

2025-10-29T23:09:52.496275297Z [inf]  [stage-0  6/10] RUN --mount=type=cache,id=s/fba6175b-59bc-4bbb-8d1a-ead414b441f5-/root/npm,target=/root/.npm npm ci
2025-10-29T23:09:52.497173414Z [inf]  [stage-0  7/10] COPY . /app/.
2025-10-29T23:09:52.760258452Z [inf]  [stage-0  7/10] COPY . /app/.
2025-10-29T23:09:52.763233694Z [inf]  [stage-0  8/10] RUN --mount=type=cache,id=s/fba6175b-59bc-4bbb-8d1a-ead414b441f5-node_modules/cache,target=/app/node_modules/.cache npm run build
2025-10-29T23:09:52.947504191Z [inf]  npm warn config production Use `--omit=dev` instead.

2025-10-29T23:09:52.96540503Z [inf]  
> mellchat-monorepo@2.0.1 build
> cd frontend/pwa && npm install && npm run build


2025-10-29T23:09:53.093629486Z [inf]  npm warn config production Use `--omit=dev` instead.

2025-10-29T23:09:56.087256068Z [inf]  
up to date, audited 552 packages in 3s

2025-10-29T23:09:56.087393478Z [inf]  
134 packages are looking for funding

2025-10-29T23:09:56.087442669Z [inf]    run `npm fund` for details

2025-10-29T23:09:56.097132449Z [inf]  
3 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.

2025-10-29T23:09:56.230993987Z [inf]  npm warn config production Use `--omit=dev` instead.

2025-10-29T23:09:56.256959224Z [inf]  
> mellchat-pwa@2.0.1 build
> vite build


2025-10-29T23:09:56.414544588Z [inf]  /app/frontend/pwa/node_modules/rollup/dist/native.js:83
		throw new Error(
		      ^

Error: Cannot find module @rollup/rollup-linux-x64-gnu. npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing both package-lock.json and node_modules directory.
    at requireWithFriendlyError (/app/frontend/pwa/node_modules/rollup/dist/native.js:83:9)
    at Object.<anonymous> (/app/frontend/pwa/node_modules/rollup/dist/native.js:92:76)
    at Module._compile (node:internal/modules/cjs/loader:1546:14)
    at Object..js (node:internal/modules/cjs/loader:1689:10)
    at Module.load (node:internal/modules/cjs/loader:1318:32)
    at Function._load (node:internal/modules/cjs/loader:1128:12)
    at TracingChannel.traceSync (node:diagnostics_channel:315:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:218:24)
    at cjsLoader (node:internal/modules/esm/translators:263:5)
    at ModuleWrap.<anonymous> (node:internal/modules/esm/translators:196:7) {
  [cause]: Error: Cannot find module '@rollup/rollup-linux-x64-gnu'
  Require stack:
  - /app/frontend/pwa/node_modules/rollup/dist/native.js
      at Function._resolveFilename (node:internal/modules/cjs/loader:1249:15)
      at Function._load (node:internal/modules/cjs/loader:1075:27)
      at TracingChannel.traceSync (node:diagnostics_channel:315:14)
      at wrapModuleLoad (node:internal/modules/cjs/loader:218:24)
      at Module.require (node:internal/modules/cjs/loader:1340:12)
      at require (node:internal/modules/helpers:141:16)
      at requireWithFriendlyError (/app/frontend/pwa/node_modules/rollup/dist/native.js:65:10)
      at Object.<anonymous> (/app/frontend/pwa/node_modules/rollup/dist/native.js:92:76)
      at Module._compile (node:internal/modules/cjs/loader:1546:14)
      at Object..js (node:internal/modules/cjs/loader:1689:10) {
    code: 'MODULE_NOT_FOUND',
    requireStack: [ '/app/frontend/pwa/node_modules/rollup/dist/native.js' ]
  }
}

Node.js v22.11.0

2025-10-29T23:09:56.422771836Z [inf]  npm error Lifecycle script `build` failed with error:

2025-10-29T23:09:56.422845874Z [inf]  npm error code 1

2025-10-29T23:09:56.422855059Z [inf]  npm error path /app/frontend/pwa

2025-10-29T23:09:56.422914928Z [inf]  npm error workspace mellchat-pwa@2.0.1

2025-10-29T23:09:56.422921054Z [inf]  npm error location /app/frontend/pwa

2025-10-29T23:09:56.422969184Z [inf]  npm error command failed

2025-10-29T23:09:56.423036937Z [inf]  npm error command sh -c vite build

2025-10-29T23:09:56.685933577Z [err]  [stage-0  8/10] RUN --mount=type=cache,id=s/fba6175b-59bc-4bbb-8d1a-ead414b441f5-node_modules/cache,target=/app/node_modules/.cache npm run build
2025-10-29T23:09:56.702487016Z [err]  Dockerfile:24
2025-10-29T23:09:56.702529744Z [err]  -------------------
2025-10-29T23:09:56.702538484Z [err]  22 |     # build phase
2025-10-29T23:09:56.702546666Z [err]  23 |     COPY . /app/.
2025-10-29T23:09:56.702556552Z [err]  24 | >>> RUN --mount=type=cache,id=s/fba6175b-59bc-4bbb-8d1a-ead414b441f5-node_modules/cache,target=/app/node_modules/.cache npm run build
2025-10-29T23:09:56.702562132Z [err]  25 |
2025-10-29T23:09:56.702567417Z [err]  26 |
2025-10-29T23:09:56.702573947Z [err]  -------------------
2025-10-29T23:09:56.702580664Z [err]  ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
2025-10-29T23:09:56.708040604Z [err]  Error: Docker build failed