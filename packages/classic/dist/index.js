var gr=Object.defineProperty;var ae=(e,t)=>{for(var r in t)gr(e,r,{get:t[r],enumerable:!0})};var mt={};ae(mt,{$componentCount:()=>xe,$componentMap:()=>S,$schema:()=>pt});var S=Symbol("componentMap"),xe=Symbol("componentCount"),pt=Symbol("schema");var lt={};ae(lt,{$dirtyQueries:()=>w,$enterQuery:()=>$r,$exitQuery:()=>Or,$modifier:()=>L,$notQueries:()=>X,$queries:()=>D,$queriesHashMap:()=>J,$queryComponents:()=>Ee,$queryDataMap:()=>E,$querySparseSet:()=>Tr,$queueRegisters:()=>ue});var L=Symbol("$modifier"),D=Symbol("queries"),X=Symbol("notQueries"),J=Symbol("queriesHashMap"),Tr=Symbol("querySparseSet"),ue=Symbol("queueRegisters"),E=Symbol("queryDataMap"),w=Symbol("$dirtyQueries"),Ee=Symbol("queryComponents"),$r=Symbol("enterQuery"),Or=Symbol("exitQuery");var yt={};ae(yt,{$entityArray:()=>B,$entityComponents:()=>A,$entityIndices:()=>Cr,$entityMasks:()=>$,$entitySparseSet:()=>g,$removedEntities:()=>Ar});var $=Symbol("entityMasks"),A=Symbol("entityComponents"),g=Symbol("entitySparseSet"),B=Symbol("entityArray"),Cr=Symbol("entityIndices"),Ar=Symbol("removedEntities");var dt={};ae(dt,{$prefabComponents:()=>He,$worldToPrefab:()=>G});var He=Symbol("prefabComponents"),G=Symbol("worldToPrefab");var W=()=>{let e=[],t=[],r=i=>e[t[i]]===i;return{add:i=>{r(i)||(t[i]=e.push(i)-1)},remove:i=>{if(!r(i))return;let a=t[i],f=e.pop();f!==i&&(e[a]=f,t[f]=a)},has:r,sparse:t,dense:e,reset:()=>{e.length=0,t.length=0},sort:()=>{e.sort((i,a)=>i-a);for(let i=0;i<e.length;i++)t[e[i]]=i}}};var bt=!1,ht=!1;function ce(){if(bt)return ht;try{return new SharedArrayBuffer(1),ht=!0,bt=!0,!0}catch{return ht=!1,bt=!0,!1}}function St(){return ce()?"grow"in SharedArrayBuffer.prototype:"resize"in ArrayBuffer.prototype}var wt=(e,t,r=!1)=>{if(e instanceof ArrayBuffer){if(St()&&!r)return e.resize(t*Uint32Array.BYTES_PER_ELEMENT),e;{let n=new ArrayBuffer(t*Uint32Array.BYTES_PER_ELEMENT);return new Uint32Array(n).set(new Uint32Array(e)),n}}else{if(St()&&!r)return e.grow(t*Uint32Array.BYTES_PER_ELEMENT),e;{let n=new SharedArrayBuffer(t*Uint32Array.BYTES_PER_ELEMENT);return new Uint32Array(n).set(new Uint32Array(e)),n}}};var Et={};ae(Et,{$buffer:()=>I,$dense:()=>N,$length:()=>M,$lengthBuffer:()=>xt,$maxCapacity:()=>Ve,$onGrowCbs:()=>Oe});var N=Symbol("dense"),M=Symbol("length"),I=Symbol("buffer"),xt=Symbol("lengthBuffer"),Ve=Symbol("maxCapacity"),Oe=Symbol("onGrowCbs");function Nt(e,t=e){let r=ce()?new SharedArrayBuffer(e*Uint32Array.BYTES_PER_ELEMENT,{maxByteLength:t*Uint32Array.BYTES_PER_ELEMENT}):new ArrayBuffer(e*Uint32Array.BYTES_PER_ELEMENT,{maxByteLength:t*Uint32Array.BYTES_PER_ELEMENT}),n=ce()?new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT):new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT),o=new Uint32Array(r),s=new Array(e),u=new Uint32Array(n,0,1);return{[N]:o,[I]:r,[xt]:n,[Ve]:t,[Oe]:new Set,get[M](){return u[0]},set[M](i){u[0]=i},sparse:s,get dense(){return Vt(this)}}}function jt(e,t){e[M]+1>e[N].length&&Ht(e,Math.max(t,Math.min(e[M]*2,e[Ve])));let r=e[M];e.sparse[t]===void 0&&(e[N][r]=t,e.sparse[t]=r,e[M]++)}function qt(e,t){return e.sparse[t]<e[M]&&e[N][e.sparse[t]]===t}function Ft(e,t){if(qt(e,t)){let r=e.sparse[t];e[N][r]=e[N][e[M]-1],e.sparse[e[N][r]]=r,delete e.sparse[t],e[M]--}}function Ht(e,t){let r=e[I],n=r.byteLength;e[I]=wt(e[I],t),e[N]=new Uint32Array(e[I]);let o={prevBuffer:r,prevSize:n,newBuffer:e[I],newSize:e[I].byteLength,didGrowInPlace:r===e[I]};for(let s of e[Oe])s(o)}function Wr(e){return e[M]}function Vt(e){return new Uint32Array(e[I],0,e[M])}function Mr(e,t){return e[Oe].add(t),()=>e[Oe].delete(t)}var ve={create:Nt,add:jt,remove:Ft,has:qt,grow:Ht,length:Wr,dense:Vt,onGrow:Mr};var Bn={...Et};var ge={i8:"i8",ui8:"ui8",ui8c:"ui8c",i16:"i16",ui16:"ui16",i32:"i32",ui32:"ui32",f32:"f32",f64:"f64",eid:"eid"},gt={i8:"Int8",ui8:"Uint8",ui8c:"Uint8Clamped",i16:"Int16",ui16:"Uint16",i32:"Int32",ui32:"Uint32",eid:"Uint32",f32:"Float32",f64:"Float64"},Z={i8:Int8Array,ui8:Uint8Array,ui8c:Uint8ClampedArray,i16:Int16Array,ui16:Uint16Array,i32:Int32Array,ui32:Uint32Array,f32:Float32Array,f64:Float64Array,eid:Uint32Array},Tt={uint8:2**8,uint16:2**16,uint32:2**32},Ce=Object.freeze([]);var Wt={};ae(Wt,{$indexBytes:()=>me,$indexType:()=>pe,$isEidType:()=>Te,$parentArray:()=>We,$queryShadow:()=>Dr,$serializeShadow:()=>Br,$storeArrayElementCounts:()=>Xe,$storeBase:()=>K,$storeFlattened:()=>O,$storeMaps:()=>Ot,$storeRef:()=>$t,$storeSize:()=>Ge,$storeSubarrays:()=>Ae,$storeType:()=>Ct,$subarray:()=>At,$subarrayCursors:()=>Je,$subarrayFrom:()=>Qr,$subarrayTo:()=>Rr,$tagStore:()=>fe});var $t=Symbol("storeRef"),Ge=Symbol("storeSize"),Ot=Symbol("storeMaps"),O=Symbol("storeFlattened"),K=Symbol("storeBase"),Ct=Symbol("storeType"),Xe=Symbol("storeArrayElementCounts"),Ae=Symbol("storeSubarrays"),Je=Symbol("subarrayCursors"),At=Symbol("subarray"),Qr=Symbol("subarrayFrom"),Rr=Symbol("subarrayTo"),We=Symbol("parentArray"),fe=Symbol("tagStore"),Dr=Symbol("queryShadow"),Br=Symbol("serializeShadow"),pe=Symbol("indexType"),me=Symbol("indexBytes"),Te=Symbol("isEidType");var Pr=e=>t=>Math.ceil(t/e)*e,vr=Pr(4),ee={};var Ze=(e,t)=>{if(ArrayBuffer.isView(e))e[t]=e.slice(0);else{let r=e[We].slice(0);e[t]=e.map((n,o)=>{let{length:s}=e[o],u=s*o,i=u+s;return r.subarray(u,i)})}};var Mt=(e,t)=>{e[O]&&e[O].forEach(r=>{ArrayBuffer.isView(r)?r[t]=0:r[t].fill(0)})},Gr=(e,t)=>{let r=t*Z[e].BYTES_PER_ELEMENT,n=ce()?new SharedArrayBuffer(r):new ArrayBuffer(r),o=new Z[e](n);return o[Te]=e===ge.eid,o},Ir=e=>e[We],Ur=(e,t,r)=>{let n=e[Ge],o=Array(n).fill(0);o[Ct]=t,o[Te]=t===ge.eid;let s=e[Je],u=r<=Tt.uint8?ge.ui8:r<=Tt.uint16?ge.ui16:ge.ui32;if(!r)throw new Error("bitECS - Must define component array length");if(!Z[t])throw new Error(`bitECS - Invalid component array property type ${t}`);if(!e[Ae][t]){let f=e[Xe][t],m=vr(f*n)*Z[t].BYTES_PER_ELEMENT,p=ce()?new SharedArrayBuffer(m):new ArrayBuffer(m),R=new Z[t](p);R[pe]=gt[u],R[me]=Z[u].BYTES_PER_ELEMENT,e[Ae][t]=R}let i=s[t],a=i+n*r;s[t]=a,o[We]=e[Ae][t].subarray(i,a);for(let f=0;f<n;f++){let m=r*f,p=m+r;o[f]=o[We].subarray(m,p),o[f][pe]=gt[u],o[f][me]=Z[u].BYTES_PER_ELEMENT,o[f][At]=!0}return o},Xt=e=>Array.isArray(e)&&typeof e[0]=="string"&&typeof e[1]=="number",Jt=(e,t)=>{let r=Symbol("store");if(!e||!Object.keys(e).length)return ee[r]={[Ge]:t,[fe]:!0,[K]:()=>ee[r]},ee[r];e=JSON.parse(JSON.stringify(e));let n={},o=u=>{let i=Object.keys(u);for(let a of i)Xt(u[a])?(n[u[a][0]]||(n[u[a][0]]=0),n[u[a][0]]+=u[a][1]):u[a]instanceof Object&&o(u[a])};o(e);let s={[Ge]:t,[Ot]:{},[Ae]:{},[$t]:r,[Je]:Object.keys(Z).reduce((u,i)=>({...u,[i]:0}),{}),[O]:[],[Xe]:n};if(e instanceof Object&&Object.keys(e).length){let u=(i,a)=>{if(typeof i[a]=="string")i[a]=Gr(i[a],t),i[a][K]=()=>ee[r],s[O].push(i[a]);else if(Xt(i[a])){let[f,m]=i[a];i[a]=Ur(s,f,m),i[a][K]=()=>ee[r],s[O].push(i[a])}else i[a]instanceof Object&&(i[a]=Object.keys(i[a]).reduce(u,i[a]));return i};return ee[r]=Object.assign(Object.keys(e).reduce(u,e),s),ee[r][K]=()=>ee[r],ee[r]}};var Ie=(e,t)=>t.sort((r,n)=>{typeof r=="function"&&r[L]&&(r=r()[0]),typeof n=="function"&&n[L]&&(n=n()[0]),e[S].has(r)||j(e,r),e[S].has(n)||j(e,n);let o=e[S].get(r),s=e[S].get(n);return o.id>s.id?1:-1}).reduce((r,n)=>{let o;typeof n=="function"&&n[L]&&(o=n()[1],n=n()[0]),e[S].has(n)||j(e,n);let s=e[S].get(n);return o?r+=`-${o}(${s.id})`:r+=`-${s.id}`,r},"");var Qt={};ae(Qt,{$archetypes:()=>Ue,$bitflag:()=>q,$bufferQueries:()=>_,$localEntities:()=>te,$localEntityLookup:()=>F,$manualEntityRecycling:()=>U,$size:()=>P});var P=Symbol("size"),q=Symbol("bitflag"),Ue=Symbol("archetypes"),te=Symbol("localEntities"),F=Symbol("localEntityLookup"),U=Symbol("manualEntityRecycling"),_=Symbol("bufferQueries");var _e=[];function Zt(e,t){let r=()=>[e,t];return r[L]=!0,r}var _r=e=>Zt(e,"not");var zr=e=>Zt(e,"changed");function Yr(...e){return function(){return e}}function kr(...e){return function(){return e}}function Lr(...e){return function(){return e}}var Me=(e,t)=>{if(e[E].has(t))return;let r=[],n=[],o=[];t[Ee].forEach(c=>{if(typeof c=="function"&&c[L]){let[h,k]=c();e[S].has(h)||j(e,h),k==="not"&&n.push(h),k==="changed"&&(o.push(h),r.push(h))}else e[S].has(c)||j(e,c),r.push(c)});let s=c=>e[S].get(c),u=r.concat(n).map(s),i;if(e[_]){let c=e[P]===-1?1e5:e[P]*2;i=ve.create(1024,c>1024?c:1024)}else i=W();let a=[],f=[],m=W(),p=[W()],R=[W()],Y=u.map(c=>c.generationId).reduce((c,h)=>(c.includes(h)||c.push(h),c),[]),d=(c,h)=>(c[h.generationId]||(c[h.generationId]=0),c[h.generationId]|=h.bitflag,c),x=r.map(s).reduce(d,{}),he=n.map(s).reduce(d,{}),y=u.reduce(d,{}),Se=r.filter(c=>!c[fe]).map(c=>Object.getOwnPropertySymbols(c).includes(O)?c[O]:[c]).reduce((c,h)=>c.concat(h),[]),T=Object.assign(i,{archetypes:a,changed:f,components:r,notComponents:n,changedComponents:o,allComponents:u,masks:x,notMasks:he,hasMasks:y,generations:Y,flatProps:Se,toRemove:m,enterQueues:p,exitQueues:R,shadows:[],query:t});e[E].set(t,T),e[D].add(T);let l=Ie(e,t[Ee]);e[J].set(l,T),u.forEach(c=>{c.queries.add(T)}),n.length&&e[X].add(T),t[ue].forEach(c=>c(e));for(let c=0;c<er();c++){if(!e[g].has(c)||H(e,$e,c))continue;Qe(e,T,c)&&Re(T,c)}},wr=(e,t)=>{let r=Symbol(),n=e.flatProps[t];return Ze(n,r),e.shadows[t]=n[r],n[r]},Nr=(e,t)=>{t&&(e.changed=[]);let{flatProps:r,shadows:n}=e;for(let o=0;o<e.dense.length;o++){let s=e.dense[o],u=!1;for(let i=0;i<r.length;i++){let a=r[i],f=n[i]||wr(e,i);if(ArrayBuffer.isView(a[s])){for(let m=0;m<a[s].length;m++)if(a[s][m]!==f[s][m]){u=!0;break}f[s].set(a[s])}else a[s]!==f[s]&&(u=!0,f[s]=a[s])}u&&e.changed.push(s)}return e.changed},jr=(e,t)=>e.concat(t),Rt=e=>t=>t.filter(r=>r.name===e().constructor.name).reduce(jr),so=Rt(Yr),io=Rt(kr),ao=Rt(Lr),ze=e=>{if(e===void 0){let r=function(n){return n[_]?new Uint32Array(n[B]):Array.from(n[B])};return r[Ee]=e,r[ue]=[],r}let t=function(r,n=!0){let o=r[E].get(t);return Kt(r),o.changedComponents.length?Nr(o,n):o.changedComponents.length?o.changed.dense:r[_]?o.dense:Array.from(o.dense)};return t[Ee]=e,t[ue]=[],_e.push(t),z.forEach(r=>Me(r,t)),t};function Ye(e,t){if(Array.isArray(t)){let r=t,n=Ie(e,r),o=e[J].get(n);return o?o.query(e):ze(r)(e)}else{let r=t;return e[_]?new Uint32Array(r(e)):Array.from(r(e))}}var Qe=(e,t,r)=>{let{masks:n,notMasks:o,generations:s}=t;for(let u=0;u<s.length;u++){let i=s[u],a=n[i],f=o[i],m=e[$][i][r];if(f&&m&f||a&&(m&a)!==a)return!1}return!0};var Re=(e,t)=>{e.toRemove.remove(t);for(let r=0;r<e.enterQueues.length;r++)e.enterQueues[r].add(t);for(let r=0;r<e.exitQueues.length;r++)e.exitQueues[r].remove(t);e.dense instanceof Uint32Array?ve.add(e,t):e.add(t)},qr=e=>{for(let t=e.toRemove.dense.length-1;t>=0;t--){let r=e.toRemove.dense[t];e.toRemove.remove(r),e.dense instanceof Uint32Array?ve.remove(e,r):e.remove(r)}},Kt=e=>{e[w].size&&(e[w].forEach(qr),e[w].clear())},ke=(e,t,r)=>{if(!(!(e[_]?ve.has(t,r):t.has(r))||t.toRemove.has(r))){t.toRemove.add(r),e[w].add(t);for(let o=0;o<t.exitQueues.length;o++)t.exitQueues[o].add(r);for(let o=0;o<t.enterQueues.length;o++)t.enterQueues[o].remove(r)}},Fr=(e,t)=>{let r=e[E].get(t);r.changed=[]},Hr=(e,t)=>{let r=e[E].get(t);e[D].delete(r),e[E].delete(t);let n=Ie(e,t[Ee]);e[J].delete(n)},Vr=e=>t=>{t[E].has(e)||Me(t,e);let r=t[E].get(e);if(r.enterQueues[0].dense.length===0)return Ce;{let n=r.enterQueues[0].dense.slice();return r.enterQueues[0].reset(),n}},Xr=e=>t=>{t[E].has(e)||Me(t,e);let r=t[E].get(e);if(r.exitQueues[0].dense.length===0)return Ce;{let n=r.exitQueues[0].dense.slice();return r.exitQueues[0].reset(),n}};var re=(e,t,r)=>Object.defineProperty(e,t,{value:r,enumerable:!1,writable:!0,configurable:!0}),Ke=(e,t)=>{let r={enumerable:!1,writable:!0,configurable:!0};Object.defineProperties(e,Reflect.ownKeys(t).reduce((n,o)=>Object.assign(n,{[o]:{value:t[o],...r}}),{}))};var Dt={};ae(Dt,{$autoRemoveSubject:()=>we,$exclusiveRelation:()=>Le,$initStore:()=>tt,$isPairComponent:()=>le,$onTargetRemoved:()=>De,$pairTarget:()=>C,$pairsMap:()=>et,$relation:()=>ne,$relationTargetEntities:()=>oe});var et=Symbol("pairsMap"),le=Symbol("isPairComponent"),ne=Symbol("relation"),C=Symbol("pairTarget"),De=Symbol("onTargetRemoved"),Le=Symbol("exclusiveRelation"),we=Symbol("autoRemoveSubject"),oe=Symbol("relationTargetEntities"),tt=Symbol("initStore");function tr(e,t,r,n){if(!r.has(n)){let o=t();re(o,le,!0),re(o,ne,e),re(o,C,n),r.set(n,o)}return r.get(n)}var rr=e=>{let t=e?.initStore||(()=>({})),r=new Map,n=function(o){if(o===void 0)throw Error("Relation target is undefined");return o==="*"&&(o=Q),tr(n,t,r,o)};return re(n,et,r),re(n,tt,t),re(n,Le,e&&e.exclusive),re(n,we,e&&e.autoRemoveSubject),re(n,De,e?e.onTargetRemoved:void 0),n},ye=(e,t)=>{if(e===void 0)throw Error("Relation is undefined");if(t===void 0)throw Error("Relation target is undefined");t==="*"&&(t=Q);let r=e[et],n=e[tt];return tr(e,n,r,t)},Q=rr(),Ne=rr(),je=(e,t,r)=>{let n=qe(e,r),o=[];for(let s of n)if(s[ne]===t&&s[C]!==Q)if(typeof s[C]=="object"&&s[C][G]){let u=s[C][G].get(e);u==null&&(u=Bt(e,s[C])),o.push(u)}else o.push(s[C]);return o};var Pt=(e={},t)=>{let r=Jt(e,t||rt());return e&&Object.keys(e).length&&(r[pt]=e),r},j=(e,t)=>{if(!t)throw new Error("bitECS - Cannot register null or undefined component");let r=new Set,n=new Set,o=new Set;e[D].forEach(u=>{u.allComponents.includes(t)&&r.add(u)});let s={id:e[xe]++,generationId:e[$].length-1,bitflag:e[q],ref:t,queries:r,notQueries:n,changedQueries:o};e[S].set(t,s),or(e)},Jr=(e,t)=>{t.forEach(r=>j(e,r))},H=(e,t,r)=>{let n=e[S].get(t);if(!n)return!1;let{generationId:o,bitflag:s}=n;return(e[$][o][r]&s)===s},nr=(e,t,r)=>{r instanceof Object&&(r=r[G].get(e)),V(e,Ne(r),t);let n=qe(e,r);for(let s of n){if(s===$e)continue;V(e,s,t);let u=Object.keys(s);for(let i of u)s[i][t]=s[i][r]}let o=je(e,Ne,r);for(let s of o)nr(e,t,s)},V=(e,t,r,n=!1)=>{if(!Gt(e,r))throw new Error("bitECS - entity does not exist in the world.");if(e[S].has(t)||j(e,t),H(e,t,r))return;let o=e[S].get(t),{generationId:s,bitflag:u,queries:i}=o;if(e[$][s][r]|=u,H(e,$e,r)||i.forEach(a=>{a.toRemove.remove(r),Qe(e,a,r)?Re(a,r):ke(e,a,r)}),e[A].get(r).add(t),n&&Mt(t,r),t[le]){let a=t[ne];V(e,ye(a,Q),r);let f=t[C];if(V(e,ye(Q,f),r),a[Le]===!0&&f!==Q){let m=je(e,a,r)[0];m&&m!==f&&de(e,a(m),r)}if(e[oe].add(f),a===Ne){let m=je(e,Ne,r);for(let p of m)nr(e,r,p)}}},vt=(e,t,r,n=!1)=>{t.forEach(o=>V(e,o,r,n))},de=(e,t,r,n=!0)=>{if(!Gt(e,r))throw new Error("bitECS - entity does not exist in the world.");if(!H(e,t,r))return;let o=e[S].get(t),{generationId:s,bitflag:u,queries:i}=o;if(e[$][s][r]&=~u,i.forEach(a=>{a.toRemove.remove(r),Qe(e,a,r)?Re(a,r):ke(e,a,r)}),e[A].get(r).delete(t),n&&Mt(t,r),t[le]){Ye(e,[Q(r)]).length===0&&e[oe].remove(r);let a=t[C];de(e,ye(Q,a),r);let f=t[ne];je(e,f,r).length===0&&de(e,ye(f,Q),r)}},Zr=(e,t,r,n=!0)=>{t.forEach(o=>de(e,o,r,n))};var ot=1e5,Ut=0,st=ot,rt=()=>st,Pe=[],Be=[],nt=[],Kr=()=>{if(Be.length===0)for(;Pe.length>0;)Be.push(Pe.pop());if(Be.length===0)throw new Error("Queue is empty");return Be.pop()},sr=()=>Pe.length+Be.length,ir=.01,_t=ir,ar=()=>{st=ot,Ut=0,_t=ir,Pe.length=0,Be.length=0,nt.length=0,_e.length=0,z.length=0},en=()=>ot,tn=e=>{ot=e,ar(),st=e},rn=e=>{_t=e},er=()=>Ut;var zt=new Map,nn=e=>{if(!e[U])throw new Error("bitECS - cannot flush removed entities, enable feature with the enableManualEntityRecycling function");Pe.push(...nt),nt.length=0},$e=Pt(),be=e=>{let t;if(e[U]&&sr()>0||!e[U]&&sr()>Math.round(st*_t)?t=Kr():t=Ut++,e[P]!==-1&&e[g].dense.length>=e[P])throw new Error("bitECS - max entities reached");return e[g].add(t),zt.set(t,e),e[X].forEach(r=>{Qe(e,r,t)&&Re(r,t)}),e[A].set(t,new Set),t},it=(e,t)=>{if(e[g].has(t)){if(e[oe].has(t)){for(let r of Ye(e,[ye(Q,t)]))if(It(e,r)){de(e,ye(Q,t),r);for(let n of e[A].get(r)){if(!n[le]||!It(e,r))continue;let o=n[ne];n[C]===t&&(de(e,n,r),o[we]&&it(e,r),o[De]&&o[De](e,r,t))}}}for(let r of e[D])ke(e,r,t);e[U]?nt.push(t):Pe.push(t),e[g].remove(t),e[A].delete(t),e[te].delete(e[F].get(t)),e[F].delete(t);for(let r=0;r<e[$].length;r++)e[$][r][t]=0}},qe=(e,t)=>{if(t===void 0)throw new Error("bitECS - entity is undefined.");if(!e[g].has(t))throw new Error("bitECS - entity does not exist in the world.");return Array.from(e[A].get(t))},It=(e,t)=>e[g].has(t);var z=[];function ur(...e){let t=typeof e[0]=="object"?e[0]:{},r=typeof e[0]=="number"?e[0]:typeof e[1]=="number"?e[1]:-1,n=W();return Ke(t,{[P]:r,[$]:[r===-1?new Array:new Array(r)],[A]:new Map,[Ue]:[],[g]:n,[B]:n.dense,[q]:1,[S]:new Map,[xe]:0,[E]:new Map,[D]:new Set,[J]:new Map,[X]:new Set,[w]:new Set,[te]:new Map,[F]:new Map,[U]:!1,[oe]:W()}),t}function cr(e){z.push(e),_e.forEach(t=>Me(e,t))}function on(...e){let t=ur(...e);return cr(t),t}var sn=(e,t=rt())=>(e[P]=t,e[B]&&e[B].forEach(r=>it(e,r)),e[$]=[t===-1?new Array:new Array(t)],e[A]=new Map,e[Ue]=[],e[g]=W(),e[B]=e[g].dense,e[q]=1,e[S]=new Map,e[xe]=0,e[E]=new Map,e[D]=new Set,e[J]=new Map,e[X]=new Set,e[w]=new Set,e[te]=new Map,e[F]=new Map,e[U]=!1,e[_]=!1,e),an=e=>{let t=e;delete t[P],delete t[$],delete t[A],delete t[Ue],delete t[g],delete t[B],delete t[q],delete t[S],delete t[xe],delete t[E],delete t[D],delete t[J],delete t[X],delete t[w],delete t[te],delete t[F],delete t[oe],delete t[U],delete t[_];let r=z.indexOf(e);r!==-1&&z.splice(r,1)},un=e=>Array.from(e[S].keys()),cn=e=>e[g].dense.slice(0),or=e=>{let t=e[P];e[q]*=2,e[q]>=2**31&&(e[q]=1,e[$].push(t===-1?new Array:new Array(t)))},Gt=(e,t)=>e[g].has(t),fn=e=>(e[U]=!0,e),pn=e=>(e[_]=!0,e);var mn=e=>(t,...r)=>(e(t,...r),t);function ln(e){let t=typeof e=="function"?e:ze(e),r=-1,n=s=>{let u=s[E].get(t);u&&(r=u.enterQueues.push(W())-1)};for(let s of z)n(s);let o=(s,u=!0)=>{let i=s[E].get(t);if(i.enterQueues[r].dense.length===0)return Ce;{let a=i.enterQueues[r].dense.slice();return u&&i.enterQueues[r].reset(),a}};return t[ue].push(n),o}function yn(e){let t=typeof e=="function"?e:ze(e),r=-1,n=s=>{let u=s[E].get(t);u&&(r=u.exitQueues.push(W())-1)};for(let s of z)n(s);let o=(s,u=!0)=>{let i=s[E].get(t);if(r===-1&&(r=i.exitQueues.push(W())-1),i.exitQueues[r].dense.length===0)return Ce;{let a=i.exitQueues[r].dense.slice();return u&&i.exitQueues[r].reset(),a}};return t[ue].push(n),o}var at={REPLACE:0,APPEND:1,MAP:2},ut=!1;var fr=(e,t)=>e.concat(t),dr=e=>t=>!e(t),Yt=e=>e[O],kt=Yt,pr=dr(kt),br=e=>typeof e=="function"&&e[L],mr=dr(br),lr=e=>br(e)&&e()[1]==="changed",hr=e=>Object.getOwnPropertySymbols(e).includes(S),yr=e=>e()[0],ct=e=>{if(hr(e))return[[],new Map];let t=e.filter(mr).filter(kt).map(Yt).reduce(fr,[]),r=e.filter(lr).map(yr).filter(kt).map(Yt).reduce(fr,[]),n=e.filter(mr).filter(pr),o=e.filter(lr).map(yr).filter(pr),s=[...t,...n,...r,...o],u=[...r,...o].reduce((i,a)=>{let f=Symbol();return Ze(a,f),i.set(a,f),i},new Map);return[s,u]},dn=(e,t=2e7)=>{let r=hr(e),[n,o]=ct(e),s=new ArrayBuffer(t),u=new DataView(s),i=new Map;return f=>{ut&&([n,o]=ct(e),ut=!1),r&&(n=[],e[S].forEach((Y,d)=>{d[O]?n.push(...d[O]):n.push(d)}));let m;Object.getOwnPropertySymbols(f).includes(S)?(m=f,f=f[B]):m=zt.get(f[0]);let p=0;if(!f.length)return s.slice(0,p);let R=new Map;for(let Y=0;Y<n.length;Y++){let d=n[Y],x=d[K](),he=o.get(d),y=he?d[he]:null;R.has(x)||R.set(x,new Map),u.setUint8(p,Y),p+=1;let Se=p;p+=4;let b=0;for(let T=0;T<f.length;T++){let l=f[T],c=i.get(l);c||(c=i.set(l,new Set).get(l)),c.add(l);let h=y&&R.get(x).get(l)||!c.has(x)&&H(m,x,l);if(R.get(x).set(l,h),h)c.add(x);else if(!H(m,x,l)){c.delete(x);continue}let k=p;if(u.setUint32(p,l),p+=4,d[fe]){b++;continue}if(ArrayBuffer.isView(d[l])){let se=d[l].constructor.name.replace("Array",""),Fe=d[l][pe],Lt=d[l][me],Sr=p;p+=Lt;let ft=0;for(let ie=0;ie<d[l].length;ie++){if(y){let Er=y[l][ie]!==d[l][ie];if(y[l][ie]=d[l][ie],!Er&&!h)continue}u[`set${Fe}`](p,ie),p+=Lt;let xr=d[l][ie];u[`set${se}`](p,xr),p+=d[l].BYTES_PER_ELEMENT,ft++}if(ft>0)u[`set${Fe}`](Sr,ft),b++;else{p=k;continue}}else{if(y){let Fe=y[l]!==d[l];if(y[l]=d[l],!Fe&&!h){p=k;continue}}let se=d.constructor.name.replace("Array","");u[`set${se}`](p,d[l]),p+=d.BYTES_PER_ELEMENT,b++}}b>0?u.setUint32(Se,b):p-=5}return s.slice(0,p)}},v=new Map,bn=e=>{let t=Object.getOwnPropertySymbols(e).includes(S),[r]=ct(e),n=new Set;return(s,u,i=0)=>{v.clear(),ut&&([r]=ct(e),ut=!1),t&&(r=[],e[S].forEach((Y,d)=>{d[O]?r.push(...d[O]):r.push(d)}));let a=s[te],f=s[F],m=new DataView(u),p=0;for(;p<u.byteLength;){let Y=m.getUint8(p);p+=1;let d=m.getUint32(p);p+=4;let x=r[Y];for(let he=0;he<d;he++){let y=m.getUint32(p);if(p+=4,i===at.MAP)if(a.has(y))y=a.get(y);else if(v.has(y))y=v.get(y);else{let b=be(s);a.set(y,b),f.set(b,y),v.set(y,b),y=b}if(i===at.APPEND||i===at.REPLACE&&!s[g].has(y)){let b=v.get(y)||be(s);v.set(y,b),y=b}let Se=x[K]();if(H(s,Se,y)||V(s,Se,y),n.add(y),!Se[fe])if(ArrayBuffer.isView(x[y])){let b=x[y],T=m[`get${b[pe]}`](p);p+=b[me];for(let l=0;l<T;l++){let c=m[`get${b[pe]}`](p);p+=b[me];let h=m[`get${b.constructor.name.replace("Array","")}`](p);if(p+=b.BYTES_PER_ELEMENT,x[Te]){let k;if(a.has(h))k=a.get(h);else if(v.has(h))k=v.get(h);else{let se=be(s);a.set(h,se),f.set(se,h),v.set(h,se),k=se}x[y][c]=k}else x[y][c]=h}}else{let b=m[`get${x.constructor.name.replace("Array","")}`](p);if(p+=x.BYTES_PER_ELEMENT,x[Te]){let T;if(a.has(b))T=a.get(b);else if(v.has(b))T=v.get(b);else{let l=be(s);a.set(b,l),f.set(l,b),v.set(b,l),T=l}x[y]=T}else x[y]=b}}}let R=Array.from(n);return n.clear(),R}};var hn=(...e)=>t=>{let r=t;for(let n=0;n<e.length;n++){let o=e[n];r=o(r)}return r};var ds=(e=[])=>{let t={};return Ke(t,{[He]:e,[G]:new Map}),t},Bt=(e,t)=>{if(t[G].has(e))return t[G].get(e);let r=Sn(e);return vt(e,t[He],r),t[G].set(e,r),r},bs=(e,t)=>t.map(r=>Bt(e,r)),Sn=e=>{let t=be(e);return V(e,$e,t),t};var Ss={...Qt,...yt,...mt,...lt,...Wt,...Dt,...dt};export{zr as Changed,at as DESERIALIZE_MODE,Ne as IsA,_r as Not,ye as Pair,Ss as SYMBOLS,ge as Types,Q as Wildcard,V as addComponent,vt as addComponents,be as addEntity,Sn as addPrefab,Ie as archetypeHash,Kt as commitRemovals,on as createWorld,Pt as defineComponent,bn as defineDeserializer,ln as defineEnterQueue,yn as defineExitQueue,ds as definePrefab,ze as defineQuery,rr as defineRelation,dn as defineSerializer,mn as defineSystem,ur as defineWorld,an as deleteWorld,pn as enableBufferedQueries,fn as enableManualEntityRecycling,Vr as enterQuery,It as entityExists,Xr as exitQuery,nn as flushRemovedEntities,cn as getAllEntities,en as getDefaultSize,qe as getEntityComponents,je as getRelationTargets,un as getWorldComponents,H as hasComponent,Ir as parentArray,hn as pipe,Ye as query,j as registerComponent,Jr as registerComponents,Bt as registerPrefab,bs as registerPrefabs,Me as registerQuery,cr as registerWorld,de as removeComponent,Zr as removeComponents,it as removeEntity,Hr as removeQuery,Fr as resetChangedQuery,ar as resetGlobals,sn as resetWorld,tn as setDefaultSize,rn as setRemovedRecycleThreshold,z as worlds};
