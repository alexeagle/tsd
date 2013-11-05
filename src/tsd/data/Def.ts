///<reference path="../_ref.ts" />
///<reference path="DefVersion.ts" />

module tsd {
	'use strict';

	var semver = require('semver');

	/*
	 Def: single definition in repo (identified by its path)
	 */
	export class Def {

		//static nameExp = /^([a-z](?:[\._\-]*[a-z0-9]+)*)\/([a-z](?:[\._\-]*[a-z0-9]+)*)\.d\.ts$/i;
		//static nameExpEnd = /([a-z](?:[\._\-]*[a-z0-9]+)*)\/([a-z](?:[\._\-]*[a-z0-9]+)*)\.d\.ts$/i;
		//^([A-Za-z](?:[\._-]*[A-Za-z0-9]+)*)\/([A-Za-z](?:[\._-]*[A-Za-z0-9]+)*)(?:-v?(\d+(?:\.\d+)*-([A-Za-z](?:[\._-]*[A-Za-z0-9]+)*)+)?(?:\.\d+)*)?\.d\.ts$

		//static namePart = /([A-Za-z](?:[\._-]*[A-Za-z0-9]+)*)/;
		//static semverPart = /(-v?(\d+(?:\.\d+)*-([A-Za-z](?:[\._-]*[A-Za-z0-9]+)*)+)?(?:\.\d+)*)?/;

		//static nameExp = /^([a-z](?:[a-z0-9\._-]*?[a-z0-9])?)\/([a-z](?:[a-z0-9\._-]*?[a-z0-9])?)\.d\.ts$/i;
		//static nameExpEnd = /([a-z](?:[a-z0-9\._-]*?[a-z0-9])?)\/([a-z](?:[a-z0-9\._-]*?[a-z0-9])?)\.d\.ts$/i;

		//simpler is better? (enforce in repo)
		//^([\w\.-]+)\/([\w\.-]+?)(?:-v?)?(\d+(?:\.\d+)*(?:-[\w]+)?)?\.d\.ts$
		static nameExp = /^([\w\.-]*)\/([\w\.-]*)\.d\.ts$/;
		static nameExpEnd = /([\w\.-]*)\/([\w\.-]*)\.d\.ts$/;

		static versionEnd = /(?:-v?)(\d+(?:\.\d+)*)((?:-[a-z]+)?)$/i;
		static twoNums = /^\d+\.\d+$/;

		// unique identifier: 'project/name' (should support 'project/name-v0.1.3-alpha')
		path:string;

		// split
		project:string;
		name:string;
		//used?
		semver:string;

		//version from the DefIndex commit +tree (may be not our edit)
		head:tsd.DefVersion;

		//versions from commits that changed this file
		history:tsd.DefVersion[] = [];

		constructor(path:string) {
			xm.assertVar(path, 'string', 'path');
			this.path = path;
		}

		//TODO test
		get pathTerm():string {
			return this.path.replace(/\.d\.ts$/, '');
		}

		toString():string {
			return this.project + '/' + this.name + (this.semver ? '-v' + this.semver : '');
		}

		//TODO test
		static getPathExp(trim:boolean):RegExp {
			var useExp:RegExp = (trim ? Def.nameExpEnd : Def.nameExp);
			useExp.lastIndex = 0;
			return useExp;
		}

		//TODO test
		static getFileFrom(path:string):string {
			var useExp:RegExp = Def.getPathExp(true);
			var match = useExp.exec(path);
			if (!match) {
				return null;
			}
			return match[1] + '/' + match[2] + '.d.ts';
		}

		static isDefPath(path:string, trim:boolean = false):boolean {
			if (Def.getPathExp(trim).test(path)) {
				Def.versionEnd.lastIndex = 0;
				var semMatch = Def.versionEnd.exec(path);
				if (!semMatch) {
					return true;
				}
				var sem = semMatch[1];
				if (Def.twoNums.test(sem)) {
					sem += '.0';
				}
				if (semMatch.length > 2) {
					sem += semMatch[2];
				}
				return semver.valid(sem);
			}
			return false;
		}

		static getFrom(path:string, trim:boolean = false):tsd.Def {
			var useExp:RegExp = Def.getPathExp(trim);

			var match:RegExpExecArray = useExp.exec(path);
			if (!match) {
				return null;
			}
			if (match.length < 1) {
				return null;
			}
			if (match[1].length < 1 || match[2].length < 1) {
				return null;
			}
			var file = new tsd.Def(path);
			file.project = match[1];
			file.name = match[2];

			Def.versionEnd.lastIndex = 0;
			var semMatch = Def.versionEnd.exec(file.name);
			if (semMatch) {
				var sem = semMatch[1];
				// append missing patch version
				if (Def.twoNums.test(sem)) {
					sem += '.0';
				}
				if (semMatch.length > 2) {
					sem += semMatch[2];
				}

				if (semver.valid(sem)) {
					file.semver = sem;
					file.name = file.name.substr(0, semMatch.index);
				}
				else {
					//xm.log.warn('invalid semver', sem);
				}
			}

			xm.ObjectUtil.lockProps(file, ['path', 'project', 'name']);

			//TODO support semver postfix 'project/name-v0.1.3-alpha'

			return file;
		}
	}
}
