///<reference path="../_ref.ts" />

module tsd {
	'use strict';

	require('date-utils');

	var fullSha = /^[0-9a-f]{40}$/;
	var hex = /^[0-9a-f]+$/g;

	/*
	 CommitMatcher
	 */
	export class CommitMatcher {

		commitSha:string;
		minimumShaLen:number = 2;

		constructor(commitSha?:string) {
			this.commitSha = String(commitSha);
		}

		filter(list:tsd.DefVersion[]):tsd.DefVersion[] {
			if (!this.commitSha) {
				return list;
			}
			return list.filter(this.getFilterFunc(this.commitSha));
		}

		getFilterFunc(commitSha:string):(file:tsd.DefVersion) => boolean {
			commitSha = commitSha.toLowerCase();

			if (fullSha.test(commitSha)) {
				return (file:tsd.DefVersion) => {
					return (file.commit && file.commit.commitSha === commitSha);
				};
			}
			if (!hex.test(commitSha)) {
				xm.throwAssert('parameter not a hex {a}', commitSha);
			}
			var len = commitSha.length;
			if (len < this.minimumShaLen) {
				xm.throwAssert('parameter hex too short {a}, {e}', this.minimumShaLen, false);
			}
			return (file:tsd.DefVersion) => {
				return (file.commit && file.commit.commitSha.substr(0, len) === commitSha
				);
			};
		}
	}
}
